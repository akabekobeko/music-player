# v1.0

music-player v1.0 の仕様書です。

## music-player とは？

クロスプラットフォームで動作するデスクトップ向け音楽プレーヤーです。

この分野は優れた先行アプリケーションが多数、存在します。ただし好みや用途にあうものはなかなかありません。そこで自分の理想を反映したものを開発することにしました。

- コレクション性を刺激する UX/UI
  - レコード棚やジャケットを眺めながら音楽を聴くような体験を提供する
  - 音楽を集めるほど楽しくなるように！
  - 歌詞のタイムライン表示やビュジュアライザーもほしい
  - メタデータを積極的に利用する
- 再生位置マーキング
  - 音楽再生の任意位置にマーカーを設置して、スキップや区間リピート操作を可能にする
  - マーカーには A メロ、B メロ、間奏、...というように任意の名前をつけられる
  - 好きなフレーズの頭出し、耳コピ参考、間奏だけ集めたプレイリスト作成、...といった用途を想定している
- 回転寿司プレイリスト
  - ランダム再生の発展系
  - 再生候補の選択はランダムだが、候補を回転寿司レーンのように見せて再生へ介入可能とする
  - 今の気分ではないものを事前スキップしたり、好みのネタ (= 音楽傾向) を注文して以降のレーンを整えたり
- Web 技術による開発
  - 例えば音楽再生に Web Audio、UI は HTML/CSS/JS、など
  - アプリケーション実装技術として実用十分であり、知見も豊富
  - v1.0 時点ではプラットフォームとして Electron を想定する
- AI 対応
  - AI 操作を想定してアプリケーション操作用の CLI を提供
  - AI にプレイリスト作成を依頼、音声バイナリーを解析させて再生位置マーキングを自動化、などを想定

## 仕様書の構成

v1.0 の開発計画と設計仕様を、機能・粒度ごとに分割して管理します。

### 計画

- [スコープ](scope.md)
  - v1.0 でやること・やらないことの定義
- [ロードマップ](roadmap.md)
  - 実装フェーズの分割と順序

### アーキテクチャー

- [プロセス構成](architecture/process-model.md)
  - Main / Preload / Renderer の責務分担、セキュリティ、カスタムプロトコル
- [技術選定](architecture/tech-stack.md)
  - ライブラリー選定と方針、バージョン、選定理由
- [IPC 設計](architecture/ipc.md)
  - チャネル定義、型共有、エラーの正規化
- [データベース](architecture/database.md)
  - スキーマ、マイグレーション、接続管理

### Renderer 設計

- [状態管理](renderer/state-management.md)
  - Context / Reducer / Command の構成 (audio-player の課題を踏まえた刷新)
- [オーディオエンジン](renderer/audio-engine.md)
  - AudioPlayer3 を class + 純関数 reducer で再設計した再生エンジン
- [ルーティングとレイアウト](renderer/routing-layout.md)
  - React Router による画面遷移、アプリ全体のレイアウト

### クロスプラットフォーム

- [システムメニュー](cross-platform/system-menu.md)
  - タイトルバーレス構成でのメニュー表示位置の調査と対応方針の選択肢

### 機能仕様

- [ライブラリー管理](features/library.md)
  - 音楽ファイルのインポート、メタデータ管理、アートワーク
- [プレーヤー UI](features/player-ui.md)
  - 再生バー、シーク、音量、エラー表示、MediaSession 連携
- [Artist ビュー](features/artist-view.md)
  - アーティスト一覧とアルバム・曲の表示、再生操作
- [Album ビュー](features/album-view.md)
  - フィルター UI によるアルバムの絞り込みと一覧表示
- [Playlist](features/playlist.md)
  - 静的プレイリスト、動的プレイリスト、カレントキューの設計

## 参考プロジェクト

本仕様は以下の実装調査に基づきます。

- audio-player
  - 音楽プレーヤーの先行プロトタイプ
  - AudioPlayer3 (ハイブリッド再生)、カスタムプロトコルによる音声配信、Artist ビューの原型
- npm-music-metadata-editor
  - メタデータ操作ライブラリー @akabeko/music-metadata-editor と、その GUI
  - IPC 設計、型共有、Base UI 版 shadcn/ui 構成の手本
- electron-starter
  - 本プロジェクトのベーステンプレート
  - ビルド構成、開発ツール、Electron バージョン同期の仕組み
