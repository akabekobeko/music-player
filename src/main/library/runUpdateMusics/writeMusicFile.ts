import { rename as fsRename, unlink as fsUnlink } from "node:fs/promises";
import {
  loadTrack as mmeLoadTrack,
  saveTrack as mmeSaveTrack,
  type SavableTrack,
  type SaveTrackOptions,
  type Track,
} from "@akabeko/music-metadata-editor";
import type { MusicPictureInput, MusicTagPatch } from "../../ipc/types";
import { applyTagPatch } from "./applyTagPatch";
import { replaceArtwork } from "./replaceArtwork";

/**
 * Suffix of the temporary file `saveTrack` writes into. It sits next to the
 * original so the final `rename` stays within one volume (atomic replace).
 */
export const TEMP_FILE_SUFFIX = ".parade-tmp";

/** Injectable seams (real mme / fs in production, fakes in tests). */
export type WriteMusicFileDeps = {
  /**
   * Read a file's metadata (mme `loadTrack`). Called twice per write: for
   * the base to edit, then to read the rewritten file back as the result.
   */
  readonly loadTrack: (filePath: string) => Promise<Track>;
  /**
   * Rebuild the file with the edited tag / pictures (mme `saveTrack`).
   * Always called with `options.source` set to the original and
   * `options.outputPath` to its `TEMP_FILE_SUFFIX` sibling; must never
   * write the original in place.
   */
  readonly saveTrack: (
    track: SavableTrack,
    options: SaveTrackOptions,
  ) => Promise<void>;
  /**
   * Replace the original with the temporary file (`fs.promises.rename`).
   * Both paths sit in the same directory, so the move is an atomic
   * same-volume rename.
   */
  readonly rename: (from: string, to: string) => Promise<void>;
  /**
   * Remove the temporary file after a failure (`fs.promises.unlink`). Its
   * own errors are swallowed: the file may never have been created.
   */
  readonly unlink: (filePath: string) => Promise<void>;
};

export const DEFAULT_WRITE_DEPS: WriteMusicFileDeps = {
  loadTrack: (filePath) => mmeLoadTrack(filePath),
  saveTrack: async (track, options) => {
    await mmeSaveTrack(track, options);
  },
  rename: fsRename,
  unlink: fsUnlink,
};

/**
 * Write a tag / artwork change into one audio file and read it back
 * (`docs/specs/v1.1/architecture/metadata-write.md`, steps 2 to 6).
 *
 * The original is never written in place: mme rebuilds the file into a
 * temporary sibling, which then replaces the original with `rename`. A
 * failure anywhere before the rename leaves the original untouched and
 * removes the temporary file (best-effort).
 *
 * @param filePath - Absolute path of the audio file.
 * @param patch - Tag fields to change.
 * @param picture - Artwork change: replacement, `null` to remove, or
 *   `undefined` to leave the pictures alone.
 * @param deps - Injectable seams; omit for production defaults.
 * @returns The track as re-read from the rewritten file.
 */
export const writeMusicFile = async (
  filePath: string,
  patch: MusicTagPatch,
  picture: MusicPictureInput | null | undefined,
  deps: WriteMusicFileDeps = DEFAULT_WRITE_DEPS,
): Promise<Track> => {
  const track = await deps.loadTrack(filePath);
  const edited: SavableTrack = {
    ...track,
    tag: applyTagPatch(track.tag, patch),
    pictures:
      picture === undefined
        ? track.pictures
        : replaceArtwork(track.pictures, picture),
  };

  const tempPath = `${filePath}${TEMP_FILE_SUFFIX}`;
  try {
    await deps.saveTrack(edited, { source: filePath, outputPath: tempPath });
    await deps.rename(tempPath, filePath);
  } catch (error) {
    try {
      await deps.unlink(tempPath);
    } catch {
      // The temporary file may never have been created; nothing to clean.
    }

    throw error;
  }

  return deps.loadTrack(filePath);
};
