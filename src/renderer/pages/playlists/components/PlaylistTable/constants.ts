/**
 * Height of the table's header row in px. A constant rather than a measured
 * value, so the row virtualisation can offset by the same number.
 */
export const PLAYLIST_TABLE_HEADER_HEIGHT = 32;

/**
 * Horizontal padding of the table's scroll container in px. Leaves room for
 * the playing row's glow, and is subtracted from the container's width to
 * get the width available to the columns.
 */
export const PLAYLIST_TABLE_PADDING_X = 24;

/**
 * Vertical padding in px before the first and after the last row, inside
 * the table body. Keeps the first row's glow clear of the fixed header.
 */
export const PLAYLIST_TABLE_PADDING_Y = 8;
