# ロードマップ

v1.0 の実装フェーズ分割です。各フェーズは「動くものが確認できる」単位で区切り、順に積み上げます。フェーズ内の詳細タスクは実装時に issue 化します。

## フェーズ一覧

```
Phase 1  基盤            IPC レイヤー / DB / カスタムプロトコル / 共有型
Phase 2  ライブラリー     インポート / メタデータ抽出 / アートワーク / 進捗通知
Phase 3  再生            オーディオエンジン / プレーヤーバー UI / MediaSession
Phase 4  Artist ビュー    アーティスト一覧 / アルバム・曲表示 / 再生導線
Phase 5  Album ビュー     フィルター UI / アルバム一覧 / 詳細表示
Phase 6  Playlist        静的プレイリスト / 動的プレイリスト / カレントキュー統合
Phase 7  仕上げ          設定画面 / ウィンドウ状態復元 / パッケージング / 配布物確認
```

## Phase 1: 基盤

**ゴール: IPC・DB・プロトコルの土台が単体テストつきで動く。**

- `src/shared/` の新設と tsconfig の参照設定 (共有定数・共有型の置き場所)
- IPC レイヤー ([IPC 設計](architecture/ipc.md))
  - `IpcResult<T>` 型と `toIpcError()` の実装
  - preload ブリッジの骨格 (`window.mp`) と型共有 (`@mp/ipc` 仮想モジュール)
- DB ([データベース](architecture/database.md))
  - 接続管理 (単一接続の保持)
  - マイグレーションランナーと v1 スキーマ
- カスタムプロトコル ([プロセス構成](architecture/process-model.md))
  - `media-stream://` (Range 対応) と `media-file://` (画像)
  - パス検証 (DB 登録済みファイルのみ許可)
  - CSP の `media-src` / `img-src` 追加
- vitest の Electron モックエイリアス設定

## Phase 2: ライブラリー

**ゴール: 手元の音楽ファイルをインポートして DB に入り、進捗が見える。**

- ファイル・ディレクトリー選択ダイアログと Drag & Drop ([ライブラリー管理](features/library.md))
- mme core (`loadTrack`) によるメタデータ抽出 (セマフォによる並列数制御)
- アートワークの SHA-256 保存と pictures テーブル登録
- インポート進捗の push 通知と UI 表示、キャンセル
- 再インポート (upsert) とライブラリーからの削除

## Phase 3: 再生

**ゴール: ライブラリーの曲を安定して再生・シークでき、状態が UI に正しく出る。**

- オーディオエンジン ([オーディオエンジン](renderer/audio-engine.md))
  - streaming / buffer ハイブリッド再生
  - snapshot + subscribe による状態通知、`useAudioPlayer` フック
  - streaming モードの `ended` 検知、エラーイベント
- PlayerProvider (キュー管理と再生コマンド) ([状態管理](renderer/state-management.md))
- プレーヤーバー UI ([プレーヤー UI](features/player-ui.md))
  - シークバー (楽観更新)、音量、前後曲、バッファリング表示、エラー表示
- MediaSession API 連携

## Phase 4: Artist ビュー

**ゴール: audio-player で半端だった Artist - Album ビューが完成形になる。**

- アーティスト一覧 (ソート、アートワーク表示) ([Artist ビュー](features/artist-view.md))
- アルバムグルーピング (albumArtist 考慮、disc 分割) と曲一覧
- Play / Shuffle ボタン、コンテキストメニュー (再生、キューへ追加、プレイリストへ追加)
- 再生中曲のハイライトと選択状態

## Phase 5: Album ビュー

**ゴール: フィルターでアルバムを絞り込んで眺められる。**

- サイドバーのフィルター UI (ジャンル、年代、テキスト検索) ([Album ビュー](features/album-view.md))
- アルバムグリッド (仮想スクロール) とアルバム詳細
- フィルター結果からの再生・キュー投入

## Phase 6: Playlist

**ゴール: プレイリストの作成・編集・再生と、動的プレイリストが動く。**

- 静的プレイリストの CRUD、並べ替え ([Playlist](features/playlist.md))
- 各ビューからの「プレイリストへ追加」導線
- 動的プレイリスト (条件ルールの保存と評価)
- カレントキューの置換ポリシー実装 (再生継続 + 新キュー基準の前後解決)

## Phase 7: 仕上げ

**ゴール: 配布物として成立する。**

- 設定画面 (テーマ、言語、ライブラリー管理)
- ウィンドウ位置・サイズの保存と復元
- アプリケーションメニュー、about ダイアログ
- アプリアイコンと electron-builder 設定 (appId、productName)
- 全体の QA (対応フォーマットの再生確認、大量曲でのスクロール性能)

## フェーズ間の依存関係

- Phase 2 以降はすべて Phase 1 の IPC / DB に依存します
- Phase 3 は Phase 2 のライブラリーがなくても、固定ファイルパスで先行開発可能です (並行作業可)
- Phase 4〜6 は Phase 3 の PlayerProvider (キュー投入 API) に依存します
- Phase 4 と Phase 5 は互いに独立しており、順序の入れ替えが可能です
