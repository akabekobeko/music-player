import type { AudioEngine } from "./types";
import { WebAudioEngine } from "./WebAudioEngine";

/**
 * Factory for the engine — the seam later phases call
 * (`docs/specs/v1.0/renderer/audio-engine.md`). PlayerProvider never uses
 * `new` directly, so the class remains an implementation detail.
 *
 * @param url - `media-stream://` URL of the audio file.
 * @param options.volume - Initial volume (`[0, 1]`).
 * @returns The engine handle.
 */
export const createAudioEngine = (
  url: string,
  options: { readonly volume?: number } = {},
): AudioEngine => new WebAudioEngine(url, options);
