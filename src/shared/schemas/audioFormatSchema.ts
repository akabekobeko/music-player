import { z } from "zod";

/**
 * Audio container formats mme can load, as a runtime list for the schema.
 * mme exports only the union type and `src/shared/` must not depend on mme,
 * so the list is kept by hand here; `MusicRowInput` in
 * `src/main/library/trackMapping.ts` types its `audioFormat` with this
 * list, which makes the importer fail to compile when mme adds a format
 * this list lacks.
 */
export const AUDIO_FORMATS = [
  "mp3",
  "flac",
  "mp4",
  "m4a",
  "ogg",
  "opus",
  "wav",
  "aiff",
  "wma",
  "ape",
] as const;

/** Audio container format stored in `musics.audio_format`. */
export const audioFormatSchema = z.enum(AUDIO_FORMATS);
