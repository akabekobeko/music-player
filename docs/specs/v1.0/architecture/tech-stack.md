# 技術選定

ライブラリー選定の方針と、採用するライブラリーの一覧・選定理由です。

## 方針

- **必要最小**: 標準 API (React 標準、Node 標準、Web 標準) で足りるものにライブラリーを足さない
- **持続性**: コミュニティーベースで開発され、継続的にメンテナンスされているものを選ぶ
- **実行時依存ゼロ**: すべて `devDependencies` に置き、Vite がバンドルする (electron-starter / mme-gui の構成を継続)。ネイティブモジュールは採用しない

## Renderer プロセス

| ライブラリー | バージョン | 用途 |
| --- | --- | --- |
| React / React DOM | 19.x | UI。状態管理もライブラリーを足さず React 標準 (useReducer / Context / useSyncExternalStore) に寄せる |
| React Router | 7.x | 画面遷移。Electron の file:// ロードのため HashRouter を使用 |
| shadcn/ui (Base UI core) | shadcn 4.x + @base-ui/react 1.x | UI コンポーネント。Radix UI ではなく Base UI を core に採用 (starter の `base-nova` style) |
| Lucide Icons (lucide-react) | 1.x | アイコン。アイコン類はこれに統一する |
| Tailwind CSS | 4.x | スタイリング。CSS-first 設定 (`tailwind.config.js` なし)、`@tailwindcss/vite` |
| @tanstack/react-virtual | 3.x | 一覧の仮想スクロール (アルバムグリッド、曲リスト)。1 万曲規模の要件を満たすため採用 |

補助: clsx / tailwind-merge / class-variance-authority / tw-animate-css (いずれも shadcn/ui の前提。starter に導入済み)。

### React Router vs TanStack Router

React Router v7 を採用します。

- 本アプリのルートは 4〜5 本 (artists / albums / playlists / settings) と少なく、TanStack Router の強みである型安全なルート定義・search params 管理の恩恵が小さい
- audio-player で React Router (HashRouter) の Electron 動作実績がある
- TanStack Router はコード生成ステップ (route tree) が増え、「必要最小」方針に反する

Album ビューのフィルター状態は URL の search params ではなく React state + settings 永続化で扱うため、search params の型安全性も決め手になりません。将来ルートが複雑化した場合に再検討します。

### 状態管理ライブラリーを入れない理由

Redux / Zustand / Jotai は採用しません。本アプリの状態は「ライブラリー (サーバー状態相当)」「カレントキュー + 再生 (高頻度更新)」「ビューのローカル状態」に分かれ、それぞれ React 標準の道具で素直に書けます ([状態管理](../renderer/state-management.md))。特に再生状態は `useSyncExternalStore` がまさに該当するユースケースです。

## Main プロセス

| ライブラリー | バージョン | 用途 |
| --- | --- | --- |
| node:sqlite (DatabaseSync) | Node 24 組み込み | ライブラリー DB。外部 SQLite パッケージ・ネイティブモジュール不要 |
| @akabeko/music-metadata-editor | 最新 | メタデータ抽出。作者本人による個人開発パッケージのため採用 |

### DB マイグレーション

専用ライブラリーは採用せず、**自前の小さなランナー (PRAGMA user_version + 番号付き SQL ファイル)** を実装します ([データベース](database.md))。

選定経緯:

- node:sqlite (同期 API) を直接サポートする定番マイグレーションライブラリーは 2026-07 時点で存在しない。既存ライブラリー (kriasoft/node-sqlite、sqlite-auto-migrator など) は sqlite3 / better-sqlite3 前提で、アダプター層を書くならランナー自体を書くのと手間が変わらない
- 汎用ツール (umzug、knex migrations) はストレージ抽象や CLI など本用途に不要な機構が大きく、「必要最小」方針に反する
- 必要な仕様は「起動時に user_version と SQL ファイル列を突き合わせ、未適用分をトランザクションで順次適用」だけであり、数十行で書けてテストも容易

代替案として umzug (Sequelize チームがメンテナンスするストレージ非依存ランナー) を検討しましたが、上記理由で見送ります。自前ランナーが破綻した場合の乗り換え先として記録しておきます。

### @akabeko/music-metadata-editor の利用方針

- **Main プロセスのみ**が値レベルで import します。Renderer へは型のみ渡します ([IPC 設計](ipc.md))
- インポート時は高レベル API `loadTrack(filePath)` で `Track` を取得します
- 対応フォーマット: mp3 / flac / mp4 / m4a / ogg / opus / wav / aiff / wma / ape
- **注意: `Track.durationMs` は VBR MP3 (Xing ヘッダーなし) で不正確**な場合があります (core は CBR 推定)。ライブラリー表示にはこの値を使いますが、再生中の総時間・シークバーは必ずオーディオエンジン側の `duration` (Chromium のデコーダー由来) を正とします

audio-player が使っていた music-metadata は採用しません。mme core で機能が足り、自作パッケージのため不具合対応・機能追加を自分で完結できるためです。

## 開発ツール

electron-starter の構成をそのまま継続します。

| ツール | 用途 |
| --- | --- |
| Vite 8 | 3 プロセス個別ビルド (main: ESM / preload: CJS / renderer: SPA)。Vite 8 は rolldown ベースのため `rolldownOptions` を使用 |
| vitest 4 | ユニットテスト。Electron モックエイリアス方式を追加 ([ロードマップ](../roadmap.md) Phase 1) |
| Biome 2 | lint / format。ESLint / Prettier は不使用 |
| lefthook | pre-commit で biome check |
| mise | Node / pnpm のバージョン固定。Node は Electron 同梱版に同期 |
| electron-builder 26 | パッケージング (mac: dmg/zip, win: nsis/zip, linux: AppImage/deb) |
| scripts/sync-electron-targets.ts | Electron 更新時に tsconfig / vite の target と mise の Node を一括同期 (starter の資産) |

shadcn/ui のコンポーネント追加は必ず `pnpm shadcn add <name>` (ラッパースクリプト経由) で行います。CLI 直叩きは tsconfig 解決の問題で import を壊すため禁止です (starter README 参照)。

## テスト方針

- ロジックは実装ファイルと同ディレクトリーに `*.test.ts` を並置 (co-location)
- Main プロセスのテストは vitest の alias で `electron` を Node-safe なスタブに差し替える (mme-gui の `src/test/electron.mock.ts` 方式)。`BrowserWindow` / `dialog` はモックせず、純関数ビルダーを経由して間接検証する
- オーディオエンジンは Web Audio / HTMLAudioElement に依存するため、状態遷移ロジックを純関数に分離してテストし、実オーディオの結合確認は手動 QA とする
- React コンポーネントテストは @testing-library/react + jsdom を必要になった時点で導入する (v1.0 必須とはしない)
