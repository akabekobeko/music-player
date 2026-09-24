# MusicBrainz データと曲情報の対応表

MusicBrainz API から取得するデータと、Parade の曲情報 (`musics` 列 / `MusicInfoCandidateTags` / 曲情報ダイアログの項目) の対応です。値の変換規則 (連結・フォールバック・大文字化) は [メタデータのマッピング](metadata-mapping.md)、取得リクエストと `inc=` の意味は [release lookup の取得方法](release-lookup.md) を参照してください。

ここに挙げた JSON パスが、[応答スキーマ](response-schema.md) に宣言する項目の一覧です。パスは release lookup の応答 JSON のルートからの相対で、`media[].tracks[]` は照合で決まった 1 トラックを指します。

## 曲情報

| ダイアログ | `MusicInfoCandidateTags` | `musics` 列 | MusicBrainz エンティティー | JSON パス | 必要な `inc=` |
| --- | --- | --- | --- | --- | --- |
| Title | `title` | `title` | track (→ recording) | `media[].tracks[].title` → `media[].tracks[].recording.title` | `recordings` |
| Artist | `artist` | `artist` | track の artist credit | `media[].tracks[]["artist-credit"][]` の `name` + `joinphrase` | `recordings` + `artist-credits` |
| Album artist | `albumArtist` | `album_artist` | release の artist credit | `["artist-credit"][]` の `name` + `joinphrase` | `artist-credits` |
| Album | `album` | `album` | release | `title` | なし |
| Year | `year` | `year` | release (→ release group) | `date` の先頭 4 桁 → `["release-group"]["first-release-date"]` の先頭 4 桁 | `release-groups` |
| Track | `track` | `track` | track | `media[].tracks[].position` | `recordings` |
| Disc | `disc` | `disc` | medium | `media[].position` | `recordings` |
| Genre | `genre` | `genre` | release group → release → recording | `["release-group"].genres[]` → `genres[]` → `media[].tracks[].recording.genres[]` の `{ name, count }` | `genres` (+ `release-groups`、`recordings`) |
| Composer | `composer` | `composer` | recording → work → artist | `media[].tracks[].recording.relations[]` (`target-type: "work"`) の `work.relations[]` で `target-type: "artist"` かつ `type: "composer"` | `work-rels` + `work-level-rels` + `artist-rels` |
| Lyricist | `lyricist` | `lyricist` | 同上 | 同上で `type: "lyricist"` | 同上 |
| Producer | `producer` | `producer` | recording → artist | `media[].tracks[].recording.relations[]` で `target-type: "artist"` かつ `type: "producer"` | `recording-level-rels` + `artist-rels` |
| Conductor | `conductor` | `conductor` | 同上 | 同上で `type: "conductor"` | 同上 |
| Publisher | `publisher` | `publisher` | label | `["label-info"][].label.name` | `labels` |
| BPM | なし | `bpm` | なし | MusicBrainz は bpm を持たない ([スコープ](../scope.md)) | |
| Rating | なし | `rating` | なし | コミュニティー評価であり個人の評価ではないため使わない | |

- artist credit の `name` はクレジット名 (曲に書かれた表記)、`artist.name` は正式名です。Parade は前者を使い、`artist` オブジェクトはスキーマに宣言しません
- 関係の相手の名前は `target-credit` → `artist.name` の順で使います ([release lookup の取得方法](release-lookup.md))
- recording は複数の work と `performance` 関係を持つことがあります (メドレー・組曲)。全 work の composer / lyricist を集め、同名を除いて `, ` で連結します
- `["label-info"][]` には `label` を持たない要素 (カタログ番号のみ) があります。`label` が非 null の先頭要素を使います
- `date` は `YYYY-MM-DD` / `YYYY-MM` / `YYYY` のいずれかで、省略されることもあります。先頭 4 桁だけを読みます
- track の `number` (`"A1"` のような文字列) ではなく `position` (整数) を使います

## アートワーク

| ダイアログ | `MusicInfoCandidate` | `musics` 列 | 出どころ | 使う JSON パス |
| --- | --- | --- | --- | --- |
| Artwork タブ | `picture` | `picture_id` (`pictures` 経由) | Cover Art Archive ([私訳](../reference/cover-art-archive-api.md)) | `id` (release MBID)、フォールバックに `["release-group"].id` |

## 識別情報 (候補にのみ含める)

| `MusicInfoCandidate` | JSON パス | 用途 |
| --- | --- | --- |
| `recordingId` | `media[].tracks[].recording.id` | 完了表示とログ。DB には保存しない ([スコープ](../scope.md)) |
| `releaseId` | `id` | 同上。Cover Art Archive の取得にも使う |
| `score` | 検索応答の `score` (下記) | 同上 |

## 照合にだけ使う項目

候補には含めず、[検索と照合](lookup-strategy.md) の判定に使う項目です。

| Parade 側 | エンドポイント | JSON パス | 用途 |
| --- | --- | --- | --- |
| `duration_ms` | release lookup | `media[].tracks[].length` → `media[].tracks[].recording.length` (ms、`null` あり) | 再生時間の差 (`DURATION_TOLERANCE_MS`) |
| `title` | release lookup | `media[].tracks[].title` | タイトルの正規化一致 |
| グループの曲数 | release 検索 | `releases[]["track-count"]` | トラック数の下限 |
| なし | release 検索 | `releases[].id`、`releases[].score` | lookup 対象の選定 (`SEARCH_SCORE_THRESHOLD`) |
| `duration_ms` | recording 検索 | `recordings[].length` | 再生時間の差 |
| `album` | recording 検索 | `recordings[].releases[]` の `id` / `title` / `status` | lookup する release の選定 |
| なし | recording 検索 | `recordings[].id`、`recordings[].score` | トラックへの照合 (`recording.id` の一致) と選定 |

検索応答の `score` は 0〜100 の整数で、JSON API では数値として返ります。
