# IPC 設計

Main - Renderer 間の IPC の設計です。mme-gui で実証済みのパターンを全面的に踏襲します。

## 原則

1. **ブリッジを throw が越えない**: すべての invoke は `IpcResult<T>` を返す。`Error` は structured clone を越えられないため、plain object に詰め替える
2. **型の単一定義**: チャネルの Request / Response 型は `src/main/ipc/types.ts` に一元定義し、Renderer は type-only import で参照する
3. **ホワイトリスト公開**: preload は `ipcRenderer` を生で露出せず、リソース単位の名前空間オブジェクトのみ公開する
4. **購読は unsubscribe を返す**: Main → Renderer の push を購読する関数は必ず `() => void` を返す。アプリ寿命の購読はブートストラップで登録し、コンポーネント寿命の購読は `useSyncExternalStore` の subscribe から使う ([状態管理](../renderer/state-management.md))
5. **バイナリーは IPC で運ばない**: 音声・画像はカスタムプロトコル経由 ([プロセス構成](process-model.md))

## IpcResult

```ts
export type IpcError = {
  readonly name: string;
  readonly code?: string; // MmeError の code や DB エラー種別
  readonly message: string;
};

export type IpcResult<T> =
  | { readonly ok: true; readonly value: T }
  | { readonly ok: false; readonly error: IpcError };
```

Renderer 側は try/catch なしで `result.ok` で分岐します。ハンドラー実装は共通の `toIpcError()` で catch を正規化します。

## 型共有: `@mp/ipc` 仮想モジュール

mme-gui の方式です。core (mme) やドメイン型に値レベルで依存するのは Main だけに閉じ込め、Renderer には型だけを届けます。

```ts
// src/main/ipc/types.ts — ドメイン型と IPC 型の単一定義場所
export type Music = { ... };
export type Artist = { ... };
export type MpBridge = { ... }; // window.mp の型

// src/renderer/vite-env.d.ts
interface Window {
  readonly mp: import("../main/ipc/types").MpBridge;
}
declare module "@mp/ipc" {
  export * from "../main/ipc/types";
}
```

Renderer は `import type { Music } from "@mp/ipc"` と書けます。`import type` はバンドル時に消えるため `@mp/ipc` は実体を持ちません。audio-player のような「Renderer が `src/main/db/*` を直接 import」「preload と renderer で型宣言が食い違う」問題を構造的に防ぎます。

## チャネル定義

命名規約は `mp:<resource>:<verb>`。チャネル名は `src/main/ipc/ipcKeys.ts` に `as const` の定数オブジェクトで定義します。ハンドラーは 1 チャネル 1 ファイル (`src/main/ipc/on<Name>.ts`)。

### Renderer → Main (invoke)

| チャネル | Request → Response | 用途 |
| --- | --- | --- |
| `mp:app:getVersions` | `void → Versions` | about 表示用 |
| `mp:dialog:openImportTargets` | `void → { paths: string[] }` | ファイル・フォルダー選択ダイアログ |
| `mp:dnd:expandPaths` | `{ paths } → { files: string[] }` | D&D されたパスの再帰展開 (深さ上限・拡張子フィルターつき) |
| `mp:library:import` | `{ paths } → ImportSummary` | インポート実行。進捗は push で通知 |
| `mp:library:cancelImport` | `void → void` | インポートのキャンセル要求 |
| `mp:library:removeMusics` | `{ musicIds } → void` | ライブラリーから削除 (ファイルは消さない) |
| `mp:library:getArtists` | `void → Artist[]` | アーティスト一覧 |
| `mp:library:getMusicsByArtist` | `{ artist } → Music[]` | アーティストの全曲 |
| `mp:library:getAlbums` | `AlbumFilter → AlbumSummary[]` | フィルター条件つきアルバム一覧 (Album ビュー用) |
| `mp:library:getMusicsByAlbum` | `{ albumKey } → Music[]` | アルバムの曲一覧 |
| `mp:library:getFilterOptions` | `void → { genres, yearRange }` | フィルター UI の選択肢 |
| `mp:playlist:list` | `void → Playlist[]` | プレイリスト一覧 (静的・動的とも) |
| `mp:playlist:create` / `update` / `remove` | 各 CRUD | 静的・動的プレイリストの管理 |
| `mp:playlist:getMusics` | `{ playlistId } → Music[]` | 内容取得。動的はルール評価結果を返す |
| `mp:settings:get` / `set` | `void → AppSettings` / `patch → AppSettings` | 設定。set は**マージ後の全体**を返し Renderer はそれを正とする |

### Renderer → Main (send)

| チャネル | 用途 |
| --- | --- |
| `mp:log:forward` | Renderer のログを Main のログへ転送 |
| `mp:menu:setState` | メニューの有効・無効状態の同期 (再生中かどうか等) |

### Main → Renderer (push)

audio-player には push チャネルが 1 本もなく、インポート進捗もライブラリー更新も通知できませんでした。v1.0 では以下を最初から設計に含めます。

| チャネル | payload | 用途 |
| --- | --- | --- |
| `mp:library:importProgress` | `{ phase, current, total, filePath, errors }` | インポート進捗。UI のプログレス表示用 |
| `mp:library:changed` | `{ kind: "imported" \| "removed" }` | ライブラリー変更通知。受信したビューはクエリを再実行する |
| `mp:menu:action` | `{ action }` | アプリケーションメニューからの操作 (インポート、設定を開く等) |

## preload ブリッジ

リソース単位でネストした単一オブジェクト `window.mp` を公開します。

```ts
contextBridge.exposeInMainWorld("mp", {
  app: { getVersions },
  dialog: { openImportTargets },
  dnd: {
    expandPaths,
    pathFor: (file: File) => webUtils.getPathForFile(file), // File.path 廃止後の唯一の手段
  },
  library: {
    import, cancelImport, removeMusics,
    getArtists, getMusicsByArtist, getAlbums, getMusicsByAlbum, getFilterOptions,
    onImportProgress, // (listener) => unsubscribe
    onChanged,        // (listener) => unsubscribe
  },
  playlist: { list, create, update, remove, getMusics },
  settings: { get, set },
  menu: { onAction, setState },
  log: { forward },
});
```

## 実装上の規約

- ハンドラー登録は `initializeIpcEvents()` に集約し、二重登録防止フラグを持つ (audio-player の `ipcHandler.ts` を踏襲)
- 一覧系クエリの並列実行が必要な処理 (インポート時のメタデータ抽出) は、fd 枯渇を防ぐためセマフォで並列数 8 に制限する (mme-gui の `onLoadMany` 方式)
- 1 件の失敗が全体を汚染しない: バッチ処理の外側は `ok: true` を返し、per-item の `IpcResult` を配列で返す
- `mp:settings:set` のように Main 側でマージ・永続化する処理は、確定後の値を返して Renderer がそれで state を上書きする (二重管理によるズレの防止)
