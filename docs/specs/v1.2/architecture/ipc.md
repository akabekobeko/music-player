# IPC 設計 (v1.2 追加分)

v1.0 の [IPC 設計](../../v1.0/architecture/ipc.md) と v1.1 の [追加分](../../v1.1/architecture/ipc.md) に追加するチャネルです。原則はすべて継承します。リソース名は `musicbrainz` とし、ライブラリー操作 (`library`) とは分けます。

## Renderer → Main (invoke)

| チャネル | Request → Response | 用途 |
| --- | --- | --- |
| `mp:musicbrainz:lookupMusic` | `{ musicId } → MusicInfoCandidate \| null` | 曲情報ダイアログの取得ボタン。1 曲の候補を返す。該当なしは `null` |
| `mp:musicbrainz:fetchMusicInfo` | `{ musicIds } → FetchMusicInfoSummary` | メニューからの一括取得。不足分を補完して書き込む。進捗は push |
| `mp:musicbrainz:cancelFetch` | `void → void` | 一括取得のキャンセル要求 |

Request / Response の型定義は [IPC 型定義](ipc-types.md) を参照してください。

## Main → Renderer (push)

| チャネル | payload | 用途 |
| --- | --- | --- |
| `mp:musicbrainz:fetchProgress` | `{ current, total, filePath, result }` | 一括取得の進捗。1 曲ごとに送る |
| `mp:library:changed` | `{ kind: "updated" }` | 既存チャネル。一括取得で 1 件以上更新できた場合に送る |

## preload ブリッジ

```ts
musicbrainz: {
  lookupMusic,      // (request) => Promise<IpcResult<MusicInfoCandidate | null>>
  fetchMusicInfo,   // (request) => Promise<IpcResult<FetchMusicInfoSummary>>
  cancelFetch,      // () => Promise<IpcResult<void>>
  onFetchProgress,  // (listener) => unsubscribe
}
```

`IpcKeys` には `LookupMusic` / `FetchMusicInfo` / `CancelFetch` / `FetchProgress` を追加します。ハンドラーは 1 チャネル 1 ファイル (`src/main/ipc/onLookupMusic.ts` など) の規約に従います。

## バイナリーの扱い

v1.0 の原則「バイナリーは IPC で運ばない」の例外として、v1.1 の `setArtistPicture` / `updateMusics` と同様に画像を `Uint8Array` で運びます。取得した画像は保存前の一時データであり、`media-file://` で参照できるファイルが存在しないためです。Renderer は受け取った `Uint8Array` を Base64 の `data:` URL にして表示します ([Artwork タブ](../features/artwork-compare.md))。
