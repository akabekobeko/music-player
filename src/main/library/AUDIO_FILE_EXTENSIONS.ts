/**
 * Audio file extensions accepted by the importer — mme core's supported
 * range (`docs/specs/v1.0/features/library.md`). Shared by the import
 * dialog's filter and the drag & drop path expansion so the two entrances
 * can never diverge.
 */
export const AUDIO_FILE_EXTENSIONS = [
  "mp3",
  "flac",
  "m4a",
  "mp4",
  "ogg",
  "opus",
  "wav",
  "aiff",
  "aif",
  "wma",
  "ape",
] as const;
