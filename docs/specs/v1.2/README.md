# v1.2

Parade v1.2 の仕様書です。v1.1 ([README](../v1.1/README.md)) で実装した曲情報の編集・保存の経路を使い、[MusicBrainz](https://musicbrainz.org/) から曲情報を取得してライブラリーへ取り込みます。

## テーマ

**MusicBrainz から曲情報を取得し、不足しているメタデータを補完する。**

- 曲・アーティスト・アルバムのメニューに「曲情報の取得」を追加し、選択範囲の曲に不足しているメタデータとアートワークを取得して DB とファイルへ保存する
- 曲情報ダイアログに「曲情報の取得」ボタンを追加し、現在の値と取得した値を並べて項目ごとに採用を選べるようにする
- MusicBrainz API の利用条件 (User-Agent の明示、1 秒あたり 1 リクエスト) を遵守するクライアントを Main プロセスに置く
- Cover Art Archive からフロントカバーを取得する

## 仕様書の構成

v1.1 と同じく、エントリーポイントを README、機能仕様を `features/` に置きます。1 ファイルの分量は日本語換算 1,000 文字を目安とし、超える場合は項目ごとに分割して分割元からリンクします。`reference/` の公式資料の私訳はこの目安の対象外です。

### 計画

- [スコープ](scope.md)
  - v1.2 でやること・やらないこと
- [ロードマップ](roadmap.md)
  - 実装フェーズの分割と順序

### アーキテクチャー

- [MusicBrainz クライアント](architecture/musicbrainz-client.md)
  - Main プロセスの HTTP クライアント、User-Agent、レート制限の遵守、再試行。[レート制限の実装](architecture/rate-limit.md)、[応答スキーマ](architecture/response-schema.md)
- [User-Agent と設定の検討](architecture/user-agent.md)
  - User-Agent をアプリ固定値とし、設定項目を追加しない判断とその理由
- [検索と照合](architecture/lookup-strategy.md)
  - アルバム単位・曲単位の検索、採用条件、リクエスト数。[検索クエリー](architecture/search-query.md)、[release lookup の取得方法](architecture/release-lookup.md)
- [メタデータのマッピング](architecture/metadata-mapping.md)
  - MusicBrainz の応答から `musics` 列への変換規則。[MusicBrainz データと曲情報の対応表](architecture/musicbrainz-data-mapping.md)
- [一括取得の処理](architecture/fetch-run.md)
  - メニューから実行したときの Main 側の手順、進捗、キャンセル
- [IPC 設計](architecture/ipc.md)
  - 取得チャネルと進捗通知。[型定義](architecture/ipc-types.md)

### 機能仕様

- [メニューからの取得](features/fetch-menu.md)
  - 曲リスト・Artists・Albums のメニュー項目と対象範囲
- [不足しているメタデータの定義](features/missing-fields.md)
  - 一括取得で補完対象になる項目の条件
- [取得ダイアログ](features/fetch-dialog.md)
  - 確認・進捗・完了の表示。処理はインポートダイアログに倣い、表示は取得向けにする
- [曲情報ダイアログの取得ボタン](features/music-info-fetch.md)
  - Footer 左端のボタン、活性条件、実行中と結果の扱い
- [取得結果の比較と採用 (Details タブ)](features/music-info-compare.md)
  - 現在の値と取得した値の 2 列表示、採用チェックボックス、採用側の枠線色。[採用色の選定](features/adopt-color.md)
- [取得結果の比較と採用 (Artwork タブ)](features/artwork-compare.md)
  - 現在の画像と取得した画像の左右表示と採用の切り替え

### 参考資料 (私訳)

- [MusicBrainz API](reference/musicbrainz-api.md)
- [MusicBrainz API / Rate Limiting](reference/musicbrainz-api-rate-limiting.md)
- [Cover Art Archive / API](reference/cover-art-archive-api.md)

## リリース

v1.2 はマイナーリリースです。機能 PR には `release:minor` ラベルを付与します ([リリース フロー](../../release.md))。
