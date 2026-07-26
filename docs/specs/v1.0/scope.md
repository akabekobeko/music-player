# v1.0 スコープ

v1.0 でやること・やらないことを定義します。

## 方針

v1.0 は「音楽プレーヤーとしての基盤と日常利用に足るコア機能」を完成させるリリースとします。プロダクトビジョン ([README](README.md)) にある特徴的な機能 (再生位置マーキング、回転寿司プレイリストなど) は、v1.0 で作る基盤の上に v1.x で実装します。ただし v1.0 の設計段階でこれらの拡張余地を確保します。

audio-player はプロトタイプとして多くの知見を得ましたが、状態管理・エラー伝搬・DB 更新系に構造的な課題があるため、コードの直接移植ではなく設計を引き直します。良い設計 (ハイブリッド再生、カスタムプロトコル、アートワークの content-hash 保存など) は仕様として引き継ぎます。

## v1.0 でやること

### 基盤

- Electron 3 プロセス構成 (electron-starter ベース)
  - 型付き IPC レイヤー ([IPC 設計](architecture/ipc.md))
  - 音声・画像配信用カスタムプロトコル ([プロセス構成](architecture/process-model.md))
- SQLite (node:sqlite) によるライブラリー DB とマイグレーション ([データベース](architecture/database.md))
- ウィンドウ状態 (位置・サイズ) と設定の永続化

### ライブラリー管理

- 音楽ファイル・ディレクトリーのインポート (ダイアログ選択と Drag & Drop)
- @akabeko/music-metadata-editor によるメタデータ抽出
- アートワークの抽出・重複排除保存
- インポート進捗の表示、再インポートによる更新、ライブラリーからの削除

### 再生

- 関数ベースのオーディオエンジン ([オーディオエンジン](renderer/audio-engine.md))
  - streaming / buffer ハイブリッド再生 (AudioPlayer3 方式の継承)
  - イベント駆動の状態通知 (再生状態、再生時間、duration、エラー、バッファー状況)
- プレーヤーバー UI (シーク、音量、前後曲、再生中表示、エラー表示)
- MediaSession API によるメディアキー・OS メディアコントロール連携

### ビュー

- Artist ビュー: アーティスト一覧 → アルバム・曲表示、再生・シャッフル (audio-player の未完部分を完成)
- Album ビュー: サイドバーのフィルター (ジャンル、年代、テキスト検索) で絞り込むアルバム一覧
- Playlist ビュー: 静的プレイリストの CRUD と、条件指定による動的プレイリスト
- カレントキュー: ビュー横断のカレント再生キュー ([Playlist](features/playlist.md))

### 開発体験

- vitest によるユニットテスト (Electron モックエイリアス方式)
- biome / lefthook / mise (electron-starter の構成を継続)
- en/ja の軽量 i18n (mme-gui 方式のフラット辞書)
  - 後付けは全 UI 文言の洗い出しが必要になり高コストのため、最初から導入する

## v1.0 でやらないこと (v1.x 以降)

| 機能 | 備考 |
| --- | --- |
| 再生位置マーキング | DB スキーマに markers テーブルの追加余地を確保。エンジンの seek / 区間リピートは拡張点として設計 |
| 回転寿司プレイリスト | カレントキューの抽象化 (キュー供給源の差し替え) で拡張可能にする |
| 歌詞タイムライン表示 | mme core が LyricsInfo (SYLT/LRC) を返せるため、取り込み口は library 設計に含める |
| ビジュアライザー | エンジンに AnalyserNode を保持し spectrums 取得 API のみ用意 |
| グラフィックイコライザー UI | エンジンのノードグラフに EQ 挿入ポイントを確保 (audio-player の GraphicEqualizer 資産を将来利用) |
| AI 対応 CLI | IPC / DB 層をプロセス外から呼べるよう、ロジックを UI から分離しておく |
| メタデータの編集 | v1.0 は読み取りのみ。編集は mme-gui との役割分担も含め別途検討 |
| コード署名・notarize・自動更新 | mme-gui と同じく手動配布。electron-builder でのパッケージングまでは行う |
| ウォッチによるライブラリー自動同期 | v1.0 は手動インポート・再スキャンのみ |

## 非機能要件

- 対応プラットフォーム: macOS / Windows / Linux (electron-builder のターゲットは starter の設定を継続)
- 対応音声フォーマット: mp3, flac, m4a/mp4, ogg/opus, wav, aiff, wma, ape
  - mme core の対応範囲に準拠。再生可否は Chromium のデコーダーに依存するため、インポート時ではなく再生時にエラーとして扱う
- ライブラリー規模の目安: 1 万曲程度までは一覧・フィルター操作が快適であること (インデックス設計と仮想スクロールで担保)
- Renderer から Node API へ直接アクセスしない (contextIsolation: true, sandbox: true)
