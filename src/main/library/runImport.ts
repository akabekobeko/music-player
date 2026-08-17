import type { DatabaseSync } from "node:sqlite";
import {
  loadTrack as mmeLoadTrack,
  type PictureInfo,
  type Track,
} from "@akabeko/music-metadata-editor";
import type {
  ImportProgressPayload,
  ImportSummary,
  IpcError,
} from "../ipc/types";
import { toIpcError } from "../ipc/utils/toIpcError";
import { imagesDirectory } from "../protocol/imagesDirectory";
import { expandAudioPaths as defaultExpandAudioPaths } from "./expandAudioPaths";
import { getOrCreatePictureId } from "./getOrCreatePictureId";
import { mapWithConcurrency } from "./mapWithConcurrency";
import { upsertMusic } from "./musicRepository";
import { registerArtistPictureIfMissing } from "./registerArtistPictureIfMissing";
import { saveArtwork } from "./saveArtwork";
import { selectArtworkPicture } from "./selectArtworkPicture";
import { type MusicRowInput, mapTrackToMusicRow } from "./trackMapping";

/** Concurrent `loadTrack` ceiling — prevents fd exhaustion. */
export const EXTRACTION_CONCURRENCY = 8;

/**
 * Files per transaction / progress push. Committing every 100 files keeps
 * each synchronous `DatabaseSync` block short, and the `await`s between
 * batches hand control back to the event loop so pushes actually flush.
 */
export const IMPORT_BATCH_SIZE = 100;

/** Callbacks the IPC layer injects into one import run. */
export type ImportRunEvents = {
  /** Progress sink → `mp:library:importProgress` push. */
  readonly onProgress: (payload: ImportProgressPayload) => void;
  /** Cancellation flag, checked at file boundaries. */
  readonly isCancelled: () => boolean;
};

/** Injectable seams (real mme / fs in production, fakes in tests). */
export type ImportRunDeps = {
  readonly loadTrack: (filePath: string) => Promise<Track>;
  readonly expandAudioPaths: (
    paths: readonly string[],
  ) => Promise<readonly string[]>;
  /** Persist one artwork image; returns its absolute path (issue #33). */
  readonly saveArtwork: (picture: PictureInfo) => Promise<string>;
  /** ISO-8601 clock for `added_at` / `updated_at`. */
  readonly now: () => string;
};

const DEFAULT_DEPS: ImportRunDeps = {
  loadTrack: (filePath) => mmeLoadTrack(filePath),
  expandAudioPaths: defaultExpandAudioPaths,
  saveArtwork: (picture) => saveArtwork(imagesDirectory(), picture),
  now: () => new Date().toISOString(),
};

/** Per-file extraction result: a mapped row or a captured failure. */
type ExtractionResult =
  | {
      readonly ok: true;
      readonly filePath: string;
      readonly row: MusicRowInput;
      /** Stored artwork path, or `null` when the file carries none. */
      readonly artworkPath: string | null;
    }
  | { readonly ok: false; readonly filePath: string; readonly error: IpcError }
  | { readonly ok: null; readonly filePath: string }; // Skipped by cancellation.

/**
 * Run one library import (`docs/specs/v1.0/features/library.md`).
 *
 * Pipeline per batch of {@link IMPORT_BATCH_SIZE} files:
 * 1. `loadTrack` under a {@link EXTRACTION_CONCURRENCY}-wide semaphore
 *    (async, parallel).
 * 2. One short transaction upserting the successfully extracted rows
 *    (synchronous, serialized by construction).
 * 3. A progress push, then back to the event loop.
 *
 * One bad file never aborts the batch — failures aggregate into
 * `ImportSummary.failed`. Cancellation is honoured at file boundaries;
 * everything already committed stays committed.
 *
 * @param db - The open library connection.
 * @param paths - Files (and/or directories) to import.
 * @param events - Progress / cancellation hooks.
 * @param deps - Injectable seams; omit for production defaults.
 * @returns The aggregate summary.
 */
export const runImport = async (
  db: DatabaseSync,
  paths: readonly string[],
  events: ImportRunEvents,
  deps: ImportRunDeps = DEFAULT_DEPS,
): Promise<ImportSummary> => {
  events.onProgress({
    phase: "enumerating",
    current: 0,
    total: 0,
    filePath: "",
    errors: 0,
  });
  const files = await deps.expandAudioPaths(paths);

  let imported = 0;
  let updated = 0;
  const failed: Array<{ filePath: string; error: IpcError }> = [];
  let processed = 0;

  const pushProgress = (filePath: string): void => {
    events.onProgress({
      phase: "importing",
      current: processed,
      total: files.length,
      filePath,
      errors: failed.length,
    });
  };

  pushProgress("");

  for (
    let batchStart = 0;
    batchStart < files.length && !events.isCancelled();
    batchStart += IMPORT_BATCH_SIZE
  ) {
    const batch = files.slice(batchStart, batchStart + IMPORT_BATCH_SIZE);

    // 1. Parallel metadata extraction. The cancel flag is re-checked before
    //    every file so a running batch drains quickly after a cancel.
    const results = await mapWithConcurrency(
      batch,
      EXTRACTION_CONCURRENCY,
      async (filePath): Promise<ExtractionResult> => {
        if (events.isCancelled()) {
          return { ok: null, filePath };
        }

        try {
          const track = await deps.loadTrack(filePath);
          for (const warning of track.warnings ?? []) {
            console.warn(`[import] ${filePath}: ${warning.message}`);
          }

          // Artwork is best-effort: a failed image write degrades the track
          // to "no artwork" instead of failing the import of the music.
          let artworkPath: string | null = null;
          const picture = selectArtworkPicture(track.pictures);
          if (picture !== null) {
            try {
              artworkPath = await deps.saveArtwork(picture);
            } catch (error) {
              console.warn(`[import] ${filePath}: artwork save failed`, error);
            }
          }

          return {
            ok: true,
            filePath,
            row: mapTrackToMusicRow(track, filePath),
            artworkPath,
          };
        } catch (error) {
          return { ok: false, filePath, error: toIpcError(error) };
        }
      },
    );

    // 2. One short transaction for the whole batch. Extracted rows of a
    //    cancelled batch still commit — "processed work stays committed".
    const now = deps.now();
    db.exec("BEGIN");
    try {
      for (const result of results) {
        if (result.ok !== true) {
          continue;
        }

        try {
          const pictureId =
            result.artworkPath !== null
              ? getOrCreatePictureId(db, result.artworkPath)
              : null;
          const outcome = upsertMusic(db, result.row, now, pictureId);
          if (pictureId !== null) {
            // Key by the display artist (album_artist falling back to
            // artist) — the identity the artist list groups by.
            registerArtistPictureIfMissing(
              db,
              result.row.albumArtist !== ""
                ? result.row.albumArtist
                : result.row.artist,
              pictureId,
            );
          }

          if (outcome === "inserted") {
            imported += 1;
          } else {
            updated += 1;
          }
        } catch (error) {
          failed.push({ filePath: result.filePath, error: toIpcError(error) });
        }
      }

      db.exec("COMMIT");
    } catch (error) {
      db.exec("ROLLBACK");
      throw error;
    }

    for (const result of results) {
      if (result.ok === false) {
        failed.push({ filePath: result.filePath, error: result.error });
      }
      if (result.ok !== null) {
        processed += 1;
      }
    }

    // 3. Progress push per batch, then yield to the event loop so the push
    //    (and any queued IPC) actually goes out between batches.
    pushProgress(batch[batch.length - 1] ?? "");
    await new Promise((resolve) => {
      setImmediate(resolve);
    });
  }

  return { imported, updated, failed };
};
