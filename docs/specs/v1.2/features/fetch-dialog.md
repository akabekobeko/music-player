# 取得ダイアログ

メニューの「曲情報の取得」([メニューからの取得](fetch-menu.md)) で開く確認・進捗・完了のダイアログ `FetchInfoDialog` です。**処理の構成 (状態機械の store、確認 → 実行 → 完了の 1 ダイアログ、キャンセル、失敗の一覧表示) はインポートダイアログ (`ImportConfirmDialog` / `importStore`) に倣い、表示内容は曲情報の取得に合わせます。**

## 状態

`fetchInfoStore` (`createFetchInfoStore` + ブリッジ注入。`createImportStore` と同じ構成) の状態です。

| status | 意味 |
| --- | --- |
| `idle` | 閉じている |
| `confirming` | 対象を表示して実行を待つ |
| `running` | 実行中。最新の `fetchProgress` と `cancelRequested` を持つ |
| `done` | 完了。`FetchMusicInfoSummary` を持つ |
| `error` | `fetchMusicInfo` 自体が `ok: false` (二重実行など) |

## 確認 (`confirming`)

```
┌ Fetch Song Info ──────────────────────────────┐
│ MusicBrainz から 12 曲の不足している情報を取得します。│
│ 既存の値は変更しません。                          │
│ ┌───────────────────────────────────────────┐ │
│ │ Nine Inch Nails / Year Zero          10 曲 │ │  ← アルバム グループごとに 1 行
│ │ (Unknown Album)                        2 曲 │ │
│ └───────────────────────────────────────────┘ │
│ 適用すると再生を停止します (現在曲を含む場合のみ)   │
│                            [Cancel] [Fetch]     │
└───────────────────────────────────────────────┘
```

- タイトルは「Fetch Song Info」(i18n `fetch.dialog.title`)
- 本文は対象の曲数と「不足分だけを補完し既存の値は変更しない」旨 ([不足しているメタデータの定義](missing-fields.md))
- 一覧はインポートのファイルパス列挙ではなく、**アルバム グループ (表示アーティスト / アルバム名) と曲数**を並べます。検索がグループ単位で行われること ([検索と照合](../architecture/lookup-strategy.md)) がそのまま見えるためです。アルバム名が空のグループは「(Unknown Album)」
- 対象に現在曲が含まれれば注意文を出し、Fetch で再生を停止します ([一括取得の処理](../architecture/fetch-run.md))

## 実行中 (`running`)

- 本文は「<current> / <total> 曲を処理中」。グループの検索中 (進捗が進まない間) は「<アルバム名> を検索中…」
- 進捗バーの下に直近の結果を「更新 N / 変更なし N / 該当なし N / 失敗 N」のカウンターで表示します (push の `result` を数える)
- フッターは Cancel だけ。押すと `cancelFetch` を送り、ボタンを非活性にして「キャンセル中…」

## 完了 (`done`)

```
│ 取得が完了しました。                              │
│   更新:     8 曲                                  │
│   変更なし: 2 曲                                  │
│   該当なし: 2 曲  (詳細)  ← 展開でタイトル一覧      │
│   失敗:     0 曲  (詳細)  ← 展開でファイル名とメッセージ │
│                                     [Close]      │
```

- キャンセルで終わった場合は「取得をキャンセルしました」。処理済み分の結果はそのまま表示します
- 「該当なし」の一覧は、ユーザーがタグを直してから再実行する、あるいは曲情報ダイアログで個別に取得するための手がかりです
- 通知 (toast) は出しません。ビューの更新と完了表示で結果が分かります

## 閉じる操作

- `confirming` / `done` / `error` では Cancel / Close / Esc / 背景クリックで閉じます
- `running` では閉じられません (Cancel でキャンセルを要求してから完了を待つ)

## 実装

- ロジックは `useFetchInfoDialog` に分け、コンポーネントは表示に専念します ([コーディングルール](../../../coding-rules/README.md))
- グループ化の表示は Renderer 側で純関数 `groupByAlbum(musics)` を使い、Main のグループ化と同じキー規則にします
- `fetchInfoStore` は完了時に `AppliedUpdate` を流し、ルート追従とキュー更新を v1.1 と同じ経路で行います ([メニューからの取得](fetch-menu.md))
