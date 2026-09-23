# IPC 設計 (v1.1 追加分)

v1.0 の [IPC 設計](../../v1.0/architecture/ipc.md) に追加するチャネルです。原則 (`IpcResult<T>`、型の単一定義、ホワイトリスト公開、push の unsubscribe) はすべて継承します。

## Renderer → Main (invoke)

| チャネル | Request → Response | 用途 |
| --- | --- | --- |
| `mp:library:updateMusics` | `UpdateMusicsRequest → UpdateMusicsSummary` | 複数曲へ同じタグ変更とアートワーク変更を適用する。進捗は push |

Request / Response の型定義は [IPC 型定義](ipc-types.md) を参照してください。

## Main → Renderer (push)

| チャネル | payload | 用途 |
| --- | --- | --- |
| `mp:library:updateProgress` | `{ current, total, filePath }` | 適用の進捗。1 ファイルごとに送る |
| `mp:library:changed` | `{ kind: "imported" \| "removed" \| "updated" }` | 既存チャネルに `"updated"` を追加。1 件以上更新できた場合に送る |

## preload ブリッジ

```ts
library: {
  ...,
  updateMusics,      // (request) => Promise<IpcResult<UpdateMusicsSummary>>
  onUpdateProgress,  // (listener) => unsubscribe
}
```

`IpcKeys` には `UpdateMusics: "mp:library:updateMusics"` と `UpdateProgress: "mp:library:updateProgress"` を追加します。ハンドラーは 1 チャネル 1 ファイル (`src/main/ipc/onUpdateMusics.ts`) の規約に従います。
