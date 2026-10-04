# カラム設定の型定義

[カラム設定の永続化](column-settings.md) と [カラム定義](../features/columns.md) で使う型です。

## AppSettings

```ts
// src/main/ipc/types.ts
export type PlaylistColumnsSettings = {
  /**
   * Ids of the optional columns shown in the Playlist view's table, in
   * display order. The always-visible columns are never listed.
   */
  readonly visibleIds: readonly string[];
  /**
   * User-resized column widths in pixels, keyed by column id. Columns that
   * were never resized are absent and use the default width.
   */
  readonly widths: Readonly<Record<string, number>>;
};

export type AppSettings = {
  // ...
  /** Column layout of the Playlist view's table, restored on next launch. */
  readonly playlistColumns?: PlaylistColumnsSettings;
};
```

- `AppSettings.version` は 1 のまま変えません。項目の追加だけで、既存の値の意味は変わらないためです
- id を `string` とするのは、Main がカラム定義に依存しないようにするためです

## カラム定義

```ts
// src/renderer/features/playlistColumns/types.ts
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
  | "lyricist"
  | "producer"
  | "conductor"
  | "publisher"
  | "bpm"
  | "rating"
  | "audioFormat"
  | "addedAt"
  | "duration"
  | "menu";

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
```

セルの描画 (`renderPlaylistCell`) と比較 (`comparePlaylistRows`) はカラム id で分岐する関数として別に持ち、カラム定義はデータだけにします。

## ソート状態

```ts
// src/renderer/pages/playlists/components/PlaylistTable/types.ts
export type PlaylistSort = {
  /** Column the rows are sorted by. `ordinal` is the playlist order. */
  readonly columnId: PlaylistColumnId;
  /** Sort direction. */
  readonly order: "asc" | "desc";
};

/** The playlist order; the state every playlist opens with. */
export const DEFAULT_PLAYLIST_SORT: PlaylistSort = {
  columnId: "ordinal",
  order: "asc",
};
```
