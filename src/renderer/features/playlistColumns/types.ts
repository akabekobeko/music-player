/** Identifier of a column the Playlist view's table can show. */
export type PlaylistColumnId =
  | "ordinal"
  | "title"
  | "artist"
  | "album"
  | "albumArtist"
  | "genre"
  | "year"
  | "track"
  | "disc"
  | "composer"
  | "bpm"
  | "rating"
  | "audioFormat"
  | "addedAt"
  | "duration"
  | "menu";

/**
 * Definition of one column of the Playlist view's table
 * (`docs/specs/v1.3/features/columns.md`). Data only: the cell rendering
 * branches on the id in its own function.
 */
export type PlaylistColumn = {
  /** Stable column identifier, also the key of the persisted settings. */
  readonly id: PlaylistColumnId;
  /** i18n key of the header label; `null` renders an empty header. */
  readonly labelKey: string | null;
  /** Default width in pixels, used until the user resizes the column. */
  readonly width: number;
  /** Whether the column is always shown and absent from the columns menu. */
  readonly pinned: boolean;
  /** Whether the column is shown before the user changes the settings. */
  readonly defaultVisible: boolean;
  /** Whether the header has a resize handle. */
  readonly resizable: boolean;
  /** Whether a header click sorts by this column. */
  readonly sortable: boolean;
  /** Horizontal alignment of the header and the cells. */
  readonly align: "start" | "end";
};

/**
 * Column widths in pixels keyed by column id. Holds the visible columns
 * only, so a hidden column has no entry.
 */
export type PlaylistColumnWidths = Readonly<
  Partial<Record<PlaylistColumnId, number>>
>;
