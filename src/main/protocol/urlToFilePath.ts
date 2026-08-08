import path from "node:path";

/**
 * Extract the filesystem path from a custom-protocol URL.
 *
 * The Renderer builds URLs as `<scheme>://<encoded absolute path>`, so the
 * remainder after the scheme is the path itself, percent-encoded. Decoding
 * happens BEFORE `path.normalize` so that encoded traversal segments
 * (`%2e%2e%2f`) collapse and can be caught by the validators — never compare
 * a raw URL string against the whitelist
 * (`docs/specs/v1.0/architecture/process-model.md`).
 *
 * @param url - Full request URL (e.g. `media-stream:///Users/a/song.flac`).
 * @param scheme - Protocol scheme without `://` (e.g. `"media-stream"`).
 * @returns The decoded, normalised filesystem path.
 */
export const urlToFilePath = (url: string, scheme: string): string => {
  const raw = url.replace(`${scheme}://`, "");
  return path.normalize(decodeURIComponent(raw));
};
