import type { AudioFormat as MmeAudioFormat } from "@akabeko/music-metadata-editor";
import { z } from "zod";

/**
 * Audio container formats mme can load, as an enum-like object for the
 * schema. mme exports only the union type, so the list is kept by hand; the
 * `satisfies` clause keeps it in sync in both directions (a format mme added
 * but this list lacks, or an entry mme does not know, fails to compile).
 */
const AUDIO_FORMATS = {
  mp3: "mp3",
  flac: "flac",
  mp4: "mp4",
  m4a: "m4a",
  ogg: "ogg",
  opus: "opus",
  wav: "wav",
  aiff: "aiff",
  wma: "wma",
  ape: "ape",
} as const satisfies { [K in MmeAudioFormat]: K };

/** Audio container format stored in `musics.audio_format`. */
export const audioFormatSchema = z.enum(AUDIO_FORMATS);
