# v1.2 スコープ

v1.2 でやること・やらないことを定義します。

## 方針

v1.1 で整えた「ファイルへ書き込み、再読込で DB へ取り込む」経路をそのまま使い、書き込む値の出どころとして MusicBrainz を加えます。取得は常にユーザーの明示的な操作 (メニューまたはボタン) で行い、バックグラウンドで自動的に問い合わせることはしません。MusicBrainz の利用条件 ([Rate Limiting](reference/musicbrainz-api-rate-limiting.md)) を守ることを機能より優先します。

## v1.2 でやること

### 取得の入口

- 曲リスト (Artists / Albums / Playlists 各ビュー共通) の曲メニューに「曲情報の取得」を追加 ([メニューからの取得](features/fetch-menu.md))
- Artists ビューのアーティスト メニューとアルバム メニュー、Albums ビューのアルバム メニューに同項目を追加
- 曲情報ダイアログの Footer 左端に「曲情報の取得」ボタンを追加 ([曲情報ダイアログの取得ボタン](features/music-info-fetch.md))

### 一括取得 (メニュー)

- 対象の曲に不足しているメタデータとアートワークだけを取得し、DB とファイルへ保存する ([不足しているメタデータの定義](features/missing-fields.md)、[一括取得の処理](architecture/fetch-run.md))
- 確認・進捗・完了を 1 つのダイアログで表示し、途中でキャンセルできる ([取得ダイアログ](features/fetch-dialog.md))

### 比較と採用 (ダイアログ)

- Details タブで現在の値と取得した値を並べ、項目ごとに採用を選ぶ ([Details タブ](features/music-info-compare.md))
- Artwork タブで現在の画像と取得した画像を並べ、どちらを採用するか選ぶ ([Artwork タブ](features/artwork-compare.md))
- 採用結果は v1.1 の適用処理 (`mp:library:updateMusics`) で保存する

### 技術基盤

- Main プロセスの MusicBrainz クライアント。User-Agent の固定値、1 秒 1 リクエストの直列化、503 の再試行 ([MusicBrainz クライアント](architecture/musicbrainz-client.md))
- Cover Art Archive からのフロントカバー取得
- 検索・照合とメタデータのマッピング ([検索と照合](architecture/lookup-strategy.md)、[メタデータのマッピング](architecture/metadata-mapping.md))

## v1.2 でやらないこと

| 機能 | 備考 |
| --- | --- |
| User-Agent の設定項目 | アプリ固定値で足りる ([User-Agent と設定の検討](architecture/user-agent.md)) |
| 取得の自動実行 | 起動時やインポート時に自動で問い合わせない。MusicBrainz の [Scheduling](reference/musicbrainz-api-rate-limiting.md) の方針にも反する |
| 既存の値の上書き (一括取得) | メニューからの取得は不足分の補完だけ。上書きは曲情報ダイアログで項目ごとに採用する |
| 候補の選択 UI | 検索結果は最上位の候補だけを使い、複数候補から選ばせない。誤マッチはダイアログで採用しないことで回避する。候補一覧は v1.x で検討 |
| AcoustID (音響指紋) による照合 | ネイティブモジュール (chromaprint) が必要で「実行時依存ゼロ」の方針に反する。タグとファイル名のテキスト照合のみ |
| MusicBrainz ID (MBID) の保存 | `musics` にスキーマを足さない。再取得は毎回検索する |
| MusicBrainz へのデータ送信 | 評価やタグの送信は行わない。認証も不要 |
| bpm / rating の取得 | MusicBrainz は bpm を持たず、rating はコミュニティー評価でありユーザー個人の評価ではない |
| アーティスト画像の取得 | MusicBrainz にアーティスト画像はない。アートワークはリリースのフロントカバーのみ |
| 複数曲選択でのダイアログ取得 | 「曲情報の取得」ボタンは単曲のときだけ活性化する |

## 非機能要件

- musicbrainz.org へのリクエストは 1 秒に 1 回を超えないこと (アプリ全体で直列化する)
- すべてのリクエストに `User-Agent` を付けること
- オフラインや 503 で 1 件が失敗しても残りの曲の処理を止めないこと (インポート・適用と同じ per-item 集約)
- 取得した画像はダイアログを閉じるまでの一時データとし、採用したときだけ保存すること
- DB スキーマの変更なし
