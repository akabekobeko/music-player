# 検索と照合

MusicBrainz には MBID なしで引ける API が検索 (search) しかありません ([私訳](../reference/musicbrainz-api.md))。Parade はライブラリーのタグ (title / artist / album / 再生時間 / トラック番号) を検索語にし、最上位の候補を lookup で読み切って 1 曲分の候補 `MusicInfoCandidate` ([IPC 型定義](ipc-types.md)) を組み立てます。

## 単位

対象の曲を**アルバム グループ** (`(COALESCE(NULLIF(album_artist, ''), artist), album)`。DB のアルバム同一性キーと同じ) に分け、グループ単位で照合します。

| グループ | 手順 | musicbrainz.org へのリクエスト数 |
| --- | --- | --- |
| album が空でない | release 検索 → release lookup → 各曲をトラックへ照合 | 2 (曲数によらない) |
| album が空 | 曲ごとに recording 検索 → その recording を含む release の lookup | 曲ごとに 2 |
| release 内で照合できなかった曲 | 曲単位の手順へフォールバック | 曲ごとに 2 |

曲情報ダイアログからの取得 (単曲) も同じ関数 `lookupMusicInfo(music)` を使い、長さ 1 のグループとして扱います。

グループ内では release の lookup とフロントカバーを release MBID ごとに 1 回だけ取得します (`ReleaseCache`)。アルバム単位で照合できなかった曲の曲単位検索が同じ release に行き着いても、lookup とカバーは再取得しません。フロントカバーは 1 曲以上がトラックへ照合できたときだけ取得します。

## release 検索 (アルバム単位)

1. `buildReleaseQuery` で検索クエリーを組み立てる ([検索クエリー](search-query.md))
2. `/release?query=...&limit=5` の上位から、**`score >= 90`** かつトラック数がグループの曲数以上のものを選ぶ。なければ「該当なし」
3. `/release/<MBID>?inc=recordings+artist-credits+labels+release-groups+genres+artist-rels+recording-level-rels+work-rels+work-level-rels` で読み切る
   - `recordings` + `artist-credits` でトラック一覧と各トラックのアーティスト
   - `labels` でレーベル (publisher)、`release-groups` で初出年とタイプ、`genres` でジャンル
   - `artist-rels` + `recording-level-rels` で各 recording のプロデューサー・指揮者
   - `work-rels` + `work-level-rels` (+ `artist-rels`) で作曲者・作詞者
   - 各値の意味とスイッチの組み合わせは [release lookup の取得方法](release-lookup.md)、応答のどこを読むかは [MusicBrainz データと曲情報の対応表](musicbrainz-data-mapping.md) を参照
4. グループの各曲を release のトラックへ照合する (下記)

## トラックへの照合

曲ごとに次の順で 1 トラックを決めます。

1. `disc` と `track` が有効 (`track > 0`) なら、medium の `position` と track の `position` が一致するトラック
2. それ以外は、タイトルの正規化一致 (大文字小文字・前後空白・全角半角を無視) かつ再生時間の差が 5 秒以内のトラック
3. 見つからなければその曲は release 内で照合できなかったものとし、曲単位の手順へ

## recording 検索 (曲単位)

1. `buildRecordingQuery` で検索クエリーを組み立てる ([検索クエリー](search-query.md))
2. `/recording?query=...&limit=5` の上位から **`score >= 90`** のものを選ぶ。再生時間が分かる場合は差が 5 秒以内であることも条件にする。なければ「該当なし」
3. その recording の `releases` から release を 1 つ選ぶ: 曲の `album` と正規化一致するもの → `status: "Official"` のもの → 先頭
4. その release を上記の `inc=` で lookup し、recording の MBID が一致するトラックを採る

## 採用条件のまとめ

| 定数 | 値 | 意味 |
| --- | --- | --- |
| `SEARCH_SCORE_THRESHOLD` | 90 | 検索スコアの下限。Lucene のスコアは 0〜100 |
| `DURATION_TOLERANCE_MS` | 5000 | 再生時間の許容差 (VBR MP3 の推定誤差を含む) |
| `SEARCH_LIMIT` | 5 | 検索結果の取得件数 |

閾値は Phase 4 の QA で調整します ([ロードマップ](../roadmap.md))。「該当なし」は失敗ではなく結果の 1 つとして扱い、一括取得では `notFound` に集約します ([一括取得の処理](fetch-run.md))。

採用条件の判定は、[応答スキーマ](response-schema.md) で `parse` 済みの値に対して行います。ここで読む項目 (`score`、`releases`、`status`、medium / track の `position`、`length` など) はすべてスキーマに宣言し、閾値そのものはスキーマの制約にしません。

## アートワーク

release が決まったら Cover Art Archive から `/release/<MBID>/front-1200` を取得します ([MusicBrainz クライアント](musicbrainz-client.md))。404 なら `/front` (原寸)、それも 404 なら release group の `/release-group/<MBID>/front-1200` を試し、すべて 404 なら「画像なし」です。画像は候補に `{ mimeType, data }` として載せ、保存するかどうかは呼び出し側が決めます。
