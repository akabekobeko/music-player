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
| `media-stream://` | 音楽ファイル。`<audio src>` から利用 | `bypassCSP, stream, corsEnabled` |
| `media-file://` | アートワーク画像 (`<img src>`、MediaSession 用の `fetch`) | `bypassCSP, supportFetchAPI, corsEnabled` |

```ts
protocol.registerSchemesAsPrivileged([
  { scheme: "media-file", privileges: { bypassCSP: true, supportFetchAPI: true, corsEnabled: true } },
  { scheme: "media-stream", privileges: { bypassCSP: true, stream: true, corsEnabled: true } },
]);
```

`corsEnabled: true` は必須です。オーディオエンジンは `<audio>` を `crossOrigin = "anonymous"` で読み込み、レスポンスに `Access-Control-Allow-Origin` を付けて CORS 承認済みにします。opaque (no-cors) なクロスオリジン メディアは `MediaElementAudioSourceNode` で無音になるうえ、Chromium の media スタックがシーク時の Range レスポンスの origin を最初のレスポンスと比較し、非 standard スキームでは必ず不一致 (opaque origin) になって `PIPELINE_ERROR_READ` で再生が止まるためです ([オーディオエンジン](../renderer/audio-engine.md) の制約 B)。

`media-file://` の `supportFetchAPI` と `corsEnabled` は、MediaSession の artwork のために必要です (2026-10-03 追記、issue #268)。Chromium は `MediaImage.src` に `http` / `https` / `data` / `blob` スキームしか受け付けないため、Renderer が `media-file://` を `fetch` して Blob URL へ変換します ([プレイヤー UI](../features/player-ui.md) の MediaSession 連携)。`media-file://` はアプリのオリジンから見てクロスオリジンであり、CORS 承認のない opaque レスポンスは body を読めないため、エラー応答 (`403` / `404`) を含むすべての応答に `Access-Control-Allow-Origin: *` を付与します (エラー応答に付けないと、Renderer 側ではステータスではなく CORS エラーとして失敗します)。配信対象は後述のパス検証で `userData/images/` 配下に限定されるため、権限を追加しても読み出せる範囲は広がりません。`<img src>` はこれらの権限なしで従来どおり動作します。

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
connect-src 'self' media-file:;
```

- `img-src` の `blob:` は、将来メタデータ内画像を直接表示する場合 (Uint8Array → Blob → objectURL) のために許可します
- `connect-src` の `media-file:` は、MediaSession の artwork を Blob URL にするための `fetch` 用です (2026-10-03 追記)。`img-src` の `blob:` はその Blob URL の読み込みにも使われます
- カスタムプロトコル側にも `bypassCSP` があるため二重の担保になりますが、意図を明示するため CSP にも記載します

`script-src` に `'unsafe-eval'` は付けません。zod はオブジェクトスキーマの生成時に `Function("")` を試行して eval の可否を判定しており、CSP がこれをブロックすると DevTools の Issues に違反が記録されます。Renderer ではエントリーの最初の import (`src/renderer/libs/configureZod.ts`) で `z.config({ jitless: true })` を設定し、判定そのものを省略します (2026-10-03 追記、issue #270)。CSP の対象外である Main は JIT を有効のままにします。

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
- `src/shared/` に置いてよいのは**両プロセスから値として参照される、プロセス固有の依存 (electron、node 組み込み、mme) を持たないコード**のみです (定数、純関数、辞書、zod スキーマ)
- ドメイン型 (Music、Album など) の zod スキーマは `src/shared/schemas/` に置き、型は `src/main/ipc/types.ts` で `z.infer` により導出して Renderer へ type-only import で渡します ([IPC 設計](ipc.md)、[データベース](database.md) の「クエリ結果の検証」)。audio-player のように Renderer が `src/main/db/*` を直接 import する構成は禁止します

## ウィンドウとアプリのライフサイクル

- ウィンドウ位置・サイズ・最大化状態を設定ファイルに保存し、起動時に復元します (mme-gui の window 設定と同方式)
- `window-all-closed` は全プラットフォームで `app.quit()` とします
  - macOS の慣習 (Dock 常駐) に反しますが、再生状態が Renderer に住む本設計ではウィンドウを閉じる = 再生終了が自然なため。バックグラウンド再生・トレイ常駐は v1.x で検討します
- OS 標準のタイトルバーは全プラットフォームで非表示にし、アプリ UI の最上段をタイトルバー相当とします (audio-player を踏襲)
  - macOS: `titleBarStyle: "hiddenInset"` (ウィンドウ操作コントロールは左上端のトラフィックライト)
  - Windows: `titleBarStyle: "hidden"` + `titleBarOverlay: { color, symbolColor, height }` (コントロールは右上端のオーバーレイ。`color` は `--background` の RGB + alpha 0 の透過色、`symbolColor` はテーマ追従。[ルーティング / レイアウト](../renderer/routing-layout.md)) + `autoHideMenuBar: true` (ネイティブメニューバーの帯を常時表示しない。[システムメニュー](../cross-platform/system-menu.md))
  - Linux: `titleBarStyle: "hidden"` + `autoHideMenuBar: true`。`titleBarOverlay` の対応状況は実装時に検証し、非対応なら Renderer に自前の最小コントロール (最小化・最大化・閉じる) を右上へ置きます
  - テーマ変更時、Main は `mp:settings:set` の theme 変更を検知し `setTitleBarOverlay()` で配色を同期します
  - `backgroundColor` は保存済みテーマ (system は OS テーマで解決) に応じた `--background` 相当色 (light `#e7ecee` / dark `#0a0a0a`) を指定します。Renderer の初回描画まで Electron 規定の白が表示され、ダークテーマで起動時にチラつくのを防ぐためです
  - ドラッグ領域とセーフエリアの扱いは [ルーティングとレイアウト](../renderer/routing-layout.md)
- 起動時の keychain ダイアログ抑止スイッチ (`use-mock-keychain` など) は electron-starter の実装を維持します

## 設定の永続化

`userData/settings.json` を Main プロセスが単独管理します (mme-gui 方式)。

- 内容: `{ version, window: { x, y, width, height, maximized }, locale?, theme?, albumFilter?, sidebar?, importDialogPath?, lastView? }`
- 書き込みは 500ms debounce + atomic write (tmp → rename)
- 読み込みは起動時に同期。壊れていればデフォルト値にフォールバック
- マージは deep-merge ではなく明示フィールド戦略 (prototype pollution の構造的回避)
- Renderer は IPC (`mp:settings:get / set`) 経由で読み書きし、**IPC のレスポンスを唯一の真実**として state に反映します
