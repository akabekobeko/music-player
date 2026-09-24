# IPC 型定義 (v1.2 追加分)

[IPC 設計](ipc.md) のチャネルが使う型です。`src/main/ipc/types.ts` に定義し、Renderer は `@mp/ipc` から type-only import します。

```ts
// src/main/ipc/types.ts

/** Tags MusicBrainz can supply. `null` means MusicBrainz has no value. */
export type MusicInfoCandidateTags = {
  readonly title: string | null;
  readonly artist: string | null;
  readonly albumArtist: string | null;
  readonly album: string | null;
  readonly genre: string | null;
  readonly year: number | null;
  readonly track: number | null;
  readonly disc: number | null;
  readonly composer: string | null;
  readonly lyricist: string | null;
  readonly producer: string | null;
  readonly conductor: string | null;
  readonly publisher: string | null;
};

export type MusicInfoCandidate = {
  /** MBID of the matched recording. */
  readonly recordingId: string;
  /** MBID of the release the tags were taken from. */
  readonly releaseId: string;
  /** Search score (0 to 100) of the match. */
  readonly score: number;
  readonly tags: MusicInfoCandidateTags;
  /** Front cover from the Cover Art Archive, or `null` when none. */
  readonly picture: MusicPictureInput | null;
};

export type LookupMusicRequest = {
  readonly musicId: number;
};

export type FetchMusicInfoRequest = {
  readonly musicIds: readonly number[];
};

export type FetchProgressPayload = {
  readonly current: number;
  readonly total: number;
  readonly filePath: string;
  readonly result: "updated" | "unchanged" | "notFound" | "failed";
};

export type FetchMusicInfoSummary = {
  readonly updated: readonly UpdatedMusic[];
  readonly unchanged: readonly { readonly musicId: number; readonly filePath: string }[];
  readonly notFound: readonly { readonly musicId: number; readonly filePath: string }[];
  readonly failed: readonly {
    readonly musicId: number;
    readonly filePath: string;
    readonly error: IpcError;
  }[];
  readonly cancelled: boolean;
};
```

- `MusicPictureInput` (`{ mimeType, data: Uint8Array }`) と `UpdatedMusic` は v1.1 の定義 ([v1.1 IPC 型定義](../../v1.1/architecture/ipc-types.md)) を再利用します
- `MusicInfoCandidateTags` は `MusicTagPatch` の部分集合 (bpm / rating を除く) に `null` を加えた形です。Renderer はダイアログで採用した項目だけを `MusicTagPatch` へ写します ([Details タブ](../features/music-info-compare.md))
- `lookupMusic` の入力検証 (id が DB に未登録) は `ok: false` にします。「該当なし」は `ok: true, value: null` で、エラーではありません
- `fetchMusicInfo` の外側 `IpcResult` が `ok: false` になるのは、空配列・重複 id・実行中の二重要求 (`MB_BUSY`) のときだけです。曲ごとの失敗は `failed` に集約します
