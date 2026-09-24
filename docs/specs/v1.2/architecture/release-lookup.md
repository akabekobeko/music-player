# release lookup の取得方法

1 曲分の候補 `MusicInfoCandidate` に必要なデータは、release lookup **1 回**の応答からすべて読みます ([検索と照合](lookup-strategy.md))。読んだ値をどの項目へ写すかは [MusicBrainz データと曲情報の対応表](musicbrainz-data-mapping.md) を参照してください。

## リクエスト

```
GET https://musicbrainz.org/ws/2/release/<MBID>?inc=recordings+artist-credits+labels+release-groups+genres+artist-rels+recording-level-rels+work-rels+work-level-rels&fmt=json
Accept: application/json
User-Agent: <アプリ固定値 (user-agent.md)>
```

`inc=` の文字列は `src/main/musicbrainz/constants.ts` の `RELEASE_LOOKUP_INC` に定数として置き、release 検索経由・recording 検索経由のどちらの lookup でも同じ値を使います。

## `inc=` の各値

| 値 | 分類 ([私訳](../reference/musicbrainz-api.md)) | 応答に加わるもの | 必要とする項目 |
| --- | --- | --- | --- |
| `recordings` | サブクエリー | `media[].tracks[]` と各トラックの `recording` | title / track / disc、トラックへの照合 |
| `artist-credits` | サブクエリーに影響する引数 | release と各 track / recording の `artist-credit` | artist / albumArtist |
| `labels` | サブクエリー | `label-info[]` | publisher |
| `release-groups` | サブクエリー | `release-group` | year (フォールバック)、genre、アートワークのフォールバック |
| `genres` | その他 | release / release-group / recording の `genres[]` | genre |
| `artist-rels` | 関係 | artist を相手とする `relations[]` | producer / conductor / composer / lyricist |
| `recording-level-rels` | 関係のスイッチ | `recordings` で含めた各 recording にも `relations[]` を付ける | producer / conductor |
| `work-rels` | 関係 | work を相手とする `relations[]` (recording → work の `performance`) | composer / lyricist |
| `work-level-rels` | 関係のスイッチ | `work-rels` で含めた各 work にも `relations[]` を付ける | composer / lyricist |

### スイッチの意味

`recording-level-rels` と `work-level-rels` は**単独では何も含めない**スイッチです。「どの階層に関係を付けるか」だけを指定し、「どの種類の関係か」は別途 `*-rels` で要求します ([私訳「関係」](../reference/musicbrainz-api.md#関係-relationships))。

| 見たい関係 | 必要な組み合わせ |
| --- | --- |
| recording → artist (producer / conductor) | `recordings` + `recording-level-rels` + `artist-rels` |
| recording → work (`performance`) | `recordings` + `recording-level-rels` + `work-rels` |
| work → artist (composer / lyricist) | 上記 + `work-level-rels` + `artist-rels` |

- `artist-rels` は 1 つ指定すれば release・recording・work のすべての階層に artist 関係が付きます。階層ごとに指定し分ける方法はありません
- release 直下の `relations[]` (デザインや撮影など) も返りますが、Parade は読みません。スキーマにも宣言しません ([応答スキーマ](response-schema.md))
- `release-group-level-rels` は使いません。release group の関係に必要な項目がないためです

## 応答 JSON の形 (抜粋)

読む項目だけを残した例です。実際の応答には他にも多くの項目がありますが、スキーマで宣言しないものは `parse` で落ちます。

```json
{
  "id": "<release MBID>",
  "title": "Year Zero",
  "status": "Official",
  "date": "2007-04-17",
  "artist-credit": [
    { "name": "Nine Inch Nails", "joinphrase": "", "artist": { "id": "...", "name": "Nine Inch Nails" } }
  ],
  "release-group": {
    "id": "<release-group MBID>",
    "primary-type": "Album",
    "first-release-date": "2007-04-13",
    "genres": [{ "name": "industrial rock", "count": 5 }]
  },
  "label-info": [
    { "catalog-number": "B0008764-02", "label": { "id": "...", "name": "Interscope Records" } }
  ],
  "genres": [],
  "media": [
    {
      "position": 1,
      "format": "CD",
      "track-count": 16,
      "tracks": [
        {
          "id": "<track MBID>",
          "position": 3,
          "number": "3",
          "title": "Survivalism",
          "length": 262000,
          "artist-credit": [{ "name": "Nine Inch Nails", "joinphrase": "" }],
          "recording": {
            "id": "<recording MBID>",
            "title": "Survivalism",
            "length": 262000,
            "genres": [],
            "relations": [
              {
                "type": "producer",
                "target-type": "artist",
                "direction": "backward",
                "target-credit": "",
                "artist": { "id": "...", "name": "Trent Reznor" }
              },
              {
                "type": "performance",
                "target-type": "work",
                "direction": "forward",
                "work": {
                  "id": "<work MBID>",
                  "title": "Survivalism",
                  "relations": [
                    { "type": "composer", "target-type": "artist", "target-credit": "", "artist": { "name": "Trent Reznor" } },
                    { "type": "lyricist", "target-type": "artist", "target-credit": "", "artist": { "name": "Trent Reznor" } }
                  ]
                }
              }
            ]
          }
        }
      ]
    }
  ]
}
```

- 関係の種類は `type` (表示名。`"producer"` や `"composer"`) で判定します。`type-id` (UUID) は人が読めないためスキーマに含めません。`direction` も読みません (recording から見た artist 関係は常に `backward`、work 関係は `forward` で、判定に使う情報がないため)
- 関係の相手は `target-type` で `artist` / `work` を見分け、同名のキー (`artist` / `work`) にエンティティーが入ります
- 関係の相手のアーティスト名は `target-credit` が空でなければそれを、空なら `artist.name` を使います。`artist-credit` でクレジット名を使うのと同じ理由です ([メタデータのマッピング](metadata-mapping.md))
- XML API では track の `title` が recording と同じとき省略されますが、JSON API では常に返ります。念のためマッピングは空のとき `recording.title` へフォールバックします
- lookup の応答はリンク先エンティティーが 25 件に制限されますが、`media[].tracks[]` はこの制限を受けません (release の一部として全トラックが返ります)
