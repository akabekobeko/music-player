/**
 * Format a byte count as decimal megabytes with one decimal, e.g. "129.3 MB".
 * The same form in every locale (docs/specs/web/architecture/i18n.md).
 *
 * @param bytes - Size in bytes.
 * @returns The formatted size.
 */
export const formatSizeMB = (bytes: number): string =>
  `${(bytes / 1_000_000).toFixed(1)} MB`;
