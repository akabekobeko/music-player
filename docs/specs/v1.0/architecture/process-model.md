# プロセス構成

Electron の Main / Preload / Renderer の責務分担と、プロセス間のデータ経路を定義します。

## 基本方針

**Renderer プロセス中心で機能実装し、Main プロセスは Renderer を補完する役割に徹します。**

| プロセス | 責務 |
| --- | --- |
| Renderer | UI 全般、音楽再生 (Web Audio API)、再生状態の保持、カレントキュー管理 |
| Main | ウィンドウ管理、DB 管理 (node:sqlite)、メタデータ抽出 (mme core)、ファイル走査、カスタムプロトコルによるメディア配信、OS ネイティブ機能 (ダイアログ、メニュー) |
| Preload | `window.mp` ブリッジの公開のみ。ロジックを持たない |

再生そのものを Renderer に置くことで、再生状態と UI の距離を最短にします。Main は「ファイルシステムと DB への出入り口」であり、再生に関しては音声データを配信するだけです。

## セキュリティ設定

audio-player は `sandbox: false` でしたが、本プロジェクトは mme-gui と同じくセキュア既定に寄せます。

```ts
webPreferences: {
  preload: path.join(__dirname, "../preload/preload.cjs"),
  contextIsolation: true,
  nodeIntegration: false,
  sandbox: true,
}
```

- Renderer は Node API に到達できません。ファイルアクセスはすべて IPC またはカスタムプロトコル経由です
- preload は sandbox 対応のため CJS (`preload.cjs`) でビルドします (electron-starter の構成を継続)

## メディアデータの経路: カスタムプロトコル

音声・画像のバイナリーは IPC で運びません。IPC (structured clone) は大容量データやストリーミングに不向きなため、privileged custom protocol を使います。audio-player で実証済みの方式です。

| プロトコル | 用途 | privileges |
| --- | --- | --- |
| `media-stream://` | 音楽ファイル。`<audio src>` と `fetch()` の両方から利用 | `bypassCSP, stream, supportFetchAPI` |
| `media-file://` | アートワーク画像 (`<img src>`) | `bypassCSP` |

```ts
protocol.registerSchemesAsPrivileged([
  { scheme: "media-file", privileges: { bypassCSP: true } },
  { scheme: "media-stream", privileges: { bypassCSP: true, stream: true, supportFetchAPI: true } },
]);
```

`supportFetchAPI: true` は必須です。オーディオエンジンが同じ URL に対して `<audio src>` (streaming 再生) と `fetch()` (buffer 再生用の全取得) の両方を使うためです ([オーディオエンジン](../renderer/audio-engine.md))。

### media-stream の応答仕様

- `Range` ヘッダーなし: ファイル全体を返す (`net.fetch(pathToFileURL(...))`)
- `Range` ヘッダーあり: `206 Partial Content` を返す
  - `Accept-Ranges: bytes` / `Content-Type` (拡張子から判定) / `Content-Length` / `Content-Range` を付与
  - Node の `ReadStream` を `ReadableStream` に変換し、`desiredSize` による背圧制御を行う (audio-player の `fetchLocalFileStream` を移植)
- **すべての応答に `Access-Control-Allow-Origin: *` を付与する** (2026-08-09 追記)。`media-stream://` はアプリのオリジン (`file://` / dev サーバー) から見てクロスオリジンであり、CORS ヘッダーなしの音源を `MediaElementAudioSourceNode` へ接続すると taint により無音になる。オーディオエンジン側は `HTMLAudioElement.crossOrigin = "anonymous"` を設定する (パス検証が musics テーブル照合で行われるため、Origin 制限を緩めても配信対象は広がらない)

### パス検証 (audio-player からの改善)

audio-player は URL のパスをそのままファイルパスとして開いており、ライブラリー外の任意ファイルを読み出せる問題がありました。v1.0 では次の検証を必須とします。

- `media-stream://` : リクエストされたパスが **musics テーブルに登録済みの file_path と一致する場合のみ**応答する
- `media-file://` : パスが**アートワーク保存ディレクトリー (`userData/images/`) 配下に正規化されるパスの場合のみ**応答する
- 検証失敗は `403` を返す。パスは `decodeURIComponent` 後に `path.normalize` してから比較する

DB 照合はリクエストごとに発生するため、Main プロセスに保持する単一 DB 接続でのインデックス付き照合 (file_path UNIQUE) とします。

## CSP

electron-starter の CSP にメディア用ソースを追加します。

```
default-src 'self';
script-src 'self';
style-src 'self' 'unsafe-inline';
img-src 'self' media-file: blob: data:;
media-src 'self' media-stream:;
```

- `img-src` の `blob:` は、将来メタデータ内画像を直接表示する場合 (Uint8Array → Blob → objectURL) のために許可します
- カスタムプロトコル側にも `bypassCSP` があるため二重の担保になりますが、意図を明示するため CSP にも記載します

## 共有型・共有定数の置き場所

electron-starter は tsconfig が node 系 (`tsconfig.node.json`) と web 系 (`tsconfig.web.json`) に分離しており、共有コードの置き場所がありません。v1.0 で `src/shared/` を新設します。

```
src/
├── main/
├── preload/
├── renderer/
└── shared/          # 追加
    ├── constants.ts # プロトコル名、アプリ名など (値として両側から参照可)
    └── locales/     # i18n 辞書 (en.ts / ja.ts)
```

- `tsconfig.node.json` と `tsconfig.web.json` の両方の include に `src/shared/**/*` を追加します
- `src/shared/` に置いてよいのは**両プロセスから値として参照される、依存のないコード**のみです (定数、純関数、辞書)
- ドメイン型 (Music、Album など) は shared ではなく `src/main/ipc/types.ts` に置き、Renderer へは type-only import で渡します ([IPC 設計](ipc.md))。audio-player のように Renderer が `src/main/db/*` を直接 import する構成は禁止します

## ウィンドウとアプリのライフサイクル

- ウィンドウ位置・サイズ・最大化状態を設定ファイルに保存し、起動時に復元します (mme-gui の window 設定と同方式)
- `window-all-closed` は全プラットフォームで `app.quit()` とします
  - macOS の慣習 (Dock 常駐) に反しますが、再生状態が Renderer に住む本設計ではウィンドウを閉じる = 再生終了が自然なため。バックグラウンド再生・トレイ常駐は v1.x で検討します
- OS 標準のタイトルバーは全プラットフォームで非表示にし、アプリ UI の最上段をタイトルバー相当とします (audio-player を踏襲)
  - macOS: `titleBarStyle: "hiddenInset"` (ウィンドウ操作コントロールは左上端のトラフィックライト)
  - Windows: `titleBarStyle: "hidden"` + `titleBarOverlay: { color, symbolColor, height }` (コントロールは右上端のオーバーレイ) + `autoHideMenuBar: true` (ネイティブメニューバーの帯を常時表示しない。[システムメニュー](../cross-platform/system-menu.md))
  - Linux: `titleBarStyle: "hidden"` + `autoHideMenuBar: true`。`titleBarOverlay` の対応状況は実装時に検証し、非対応なら Renderer に自前の最小コントロール (最小化・最大化・閉じる) を右上へ置きます
  - テーマ変更時、Main は `mp:settings:set` の theme 変更を検知し `setTitleBarOverlay()` で配色を同期します
  - `backgroundColor` は保存済みテーマ (system は OS テーマで解決) に応じた `--background` 相当色 (light `#ffffff` / dark `#0a0a0a`) を指定します。Renderer の初回描画まで Electron 規定の白が表示され、ダークテーマで起動時にチラつくのを防ぐためです
  - ドラッグ領域とセーフエリアの扱いは [ルーティングとレイアウト](../renderer/routing-layout.md)
- 起動時の keychain ダイアログ抑止スイッチ (`use-mock-keychain` など) は electron-starter の実装を維持します

## 設定の永続化

`userData/settings.json` を Main プロセスが単独管理します (mme-gui 方式)。

- 内容: `{ version, window: { x, y, width, height, maximized }, locale?, theme?, albumFilter?, sidebar?, importDialogPath?, lastView? }`
- 書き込みは 500ms debounce + atomic write (tmp → rename)
- 読み込みは起動時に同期。壊れていればデフォルト値にフォールバック
- マージは deep-merge ではなく明示フィールド戦略 (prototype pollution の構造的回避)
- Renderer は IPC (`mp:settings:get / set`) 経由で読み書きし、**IPC のレスポンスを唯一の真実**として state に反映します
