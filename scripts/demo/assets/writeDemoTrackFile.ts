import { execFileSync } from "node:child_process";
import {
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import os from "node:os";
import path from "node:path";
import {
  loadTrack,
  PictureKind,
  saveTrack,
} from "@akabeko/music-metadata-editor";
import { synthesizeDemoToneWav } from "./synthesizeDemoToneWav.ts";
import type { DemoTrack } from "./types.ts";

/** AAC bit rate of the encoded file in bits per second. */
const BIT_RATE = 96_000;

/** Inputs of {@link writeDemoTrackFile}. */
type Params = {
  /** The playable track; its values become the tags of the file. */
  readonly track: DemoTrack;
  /** Destination path of the m4a file. */
  readonly outputPath: string;
  /** Path of the album cover JPEG to embed. */
  readonly coverPath: string;
};

/**
 * Create the audio file of the playable demo track.
 *
 * Synthesizes the tone sequence, encodes it to AAC with `afconvert` (macOS
 * only) and writes the same tags the database row carries, so importing the
 * file into a regular library shows the same values.
 *
 * @param params - See {@link Params}.
 * @returns void.
 */
export const writeDemoTrackFile = async ({
  track,
  outputPath,
  coverPath,
}: Params): Promise<void> => {
  const workDir = mkdtempSync(path.join(os.tmpdir(), "parade-demo-"));
  try {
    const wavPath = path.join(workDir, "tone.wav");
    writeFileSync(wavPath, synthesizeDemoToneWav(track.durationMs / 1000));
    mkdirSync(path.dirname(outputPath), { recursive: true });
    execFileSync(
      "afconvert",
      ["-f", "m4af", "-d", "aac", "-b", String(BIT_RATE), wavPath, outputPath],
      { stdio: "ignore" },
    );
  } finally {
    rmSync(workDir, { recursive: true, force: true });
  }

  const loaded = await loadTrack(outputPath);
  await saveTrack(
    {
      ...loaded,
      tag: {
        ...loaded.tag,
        title: track.title,
        artist: track.artist,
        albumArtist: track.albumArtist,
        album: track.album,
        discNumber: track.disc,
        trackNumber: track.track,
        year: track.year,
        genre: track.genre,
        composer: track.composer,
        lyricist: track.lyricist,
        producer: track.producer,
        conductor: track.conductor,
        publisher: track.publisher,
        bpm: track.bpm,
        rating: track.rating,
      },
      pictures: [
        {
          mimeType: "image/jpeg",
          kind: PictureKind.CoverFront,
          data: readFileSync(coverPath),
        },
      ],
    },
    { source: outputPath },
  );
};
