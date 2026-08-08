/** Inclusive byte range resolved against a concrete file size. */
export type ByteRange = {
  readonly start: number;
  readonly end: number;
};

/**
 * Parse an HTTP `Range` header against the target file size.
 *
 * Supports the single-range `bytes=<start>-<end>` form (either bound may be
 * omitted) that Chromium's media stack emits; multipart ranges are not
 * needed for `<audio>` playback and are rejected.
 *
 * @param range - Raw `Range` header value.
 * @param size - Size of the target file in bytes.
 * @returns The resolved inclusive range, or `null` when the header is
 *   malformed or out of bounds (callers respond `416`).
 */
export const parseByteRange = (
  range: string,
  size: number,
): ByteRange | null => {
  const match = range.match(/^bytes=(\d*)-(\d*)$/);
  if (!match) {
    return null;
  }

  const [, rawStart, rawEnd] = match;
  if (rawStart === "" && rawEnd === "") {
    return null;
  }

  // `bytes=-N` means "the last N bytes".
  if (rawStart === "") {
    const suffixLength = Number.parseInt(rawEnd as string, 10);
    if (suffixLength === 0 || size === 0) {
      return null;
    }
    return { start: Math.max(0, size - suffixLength), end: size - 1 };
  }

  const start = Number.parseInt(rawStart as string, 10);
  const end = rawEnd === "" ? size - 1 : Number.parseInt(rawEnd as string, 10);
  if (start > end || size <= start) {
    return null;
  }

  return { start, end: Math.min(end, size - 1) };
};
