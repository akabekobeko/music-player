# IPC 型定義 (v1.1 追加分)

[IPC 設計](ipc.md) の `mp:library:updateMusics` が使う型です。`src/main/ipc/types.ts` に定義し、Renderer は `@mp/ipc` から type-only import します。

```ts
// src/main/ipc/types.ts
export type MusicTagPatch = {
  readonly title?: string;
  readonly artist?: string;
  readonly albumArtist?: string;
  readonly album?: string;
  readonly genre?: string;
  readonly composer?: string;
  readonly lyricist?: string;
  readonly producer?: string;
  readonly conductor?: string;
  readonly publisher?: string;
  /** null clears the tag. */
  readonly year?: number | null;
  readonly track?: number;
  readonly disc?: number;
  readonly bpm?: number | null;
  readonly rating?: number | null;
};

export type UpdateMusicsRequest = {
  readonly musicIds: readonly number[];
  /** Only the fields to change; absent fields are left as they are. */
  readonly patch: MusicTagPatch;
  /**
   * Front cover to embed, `null` to remove the artwork, or absent to leave
   * it untouched. Bytes travel like `mp:library:setArtistPicture`.
   */
  readonly picture?: { readonly mimeType: string; readonly data: Uint8Array } | null;
};

export type UpdatedMusic = {
  readonly music: Music;
  /** Display artist after the update (album_artist, falling back to artist). */
  readonly displayArtist: string;
  /** Album identity key after the update (same as AlbumSummary.albumKey). */
  readonly albumKey: string;
};

export type UpdateMusicsSummary = {
  readonly updated: readonly UpdatedMusic[];
  readonly failed: readonly {
    readonly musicId: number;
    readonly filePath: string;
    readonly error: IpcError;
  }[];
};
```

- `patch` は変更のあった項目だけを含めます。含めない項目はファイルも DB も変更しません
- `picture` は差し替え (`{ mimeType, data }`)、削除 (`null`)、変更なし (省略) の 3 値です。MIME は `IMAGE_EXTENSION_BY_MIME` にあるものだけ受け付け、空データは入力検証エラーにします
- 文字列項目の空文字は「タグを削除する」意味です。`title` だけは空文字を許可せず、Renderer の validation で弾きます ([編集項目と validation](../features/music-info-fields.md))
- 1 件の失敗は全体を止めず `failed` に集約します (インポートと同じ規約)。外側の `IpcResult` は入力検証 (id の重複、空配列、DB 未登録) のときだけ `ok: false` になります
- `displayArtist` / `albumKey` は Renderer のルート追従に使います ([ルートの追従](../features/route-follow.md))
