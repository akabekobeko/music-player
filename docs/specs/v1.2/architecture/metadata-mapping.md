# メタデータのマッピング

release lookup の応答 ([検索と照合](lookup-strategy.md)) から `MusicInfoCandidate.tags` ([IPC 型定義](ipc-types.md)) を組み立てる規則です。純関数 `toMusicInfoCandidate(release, track)` として実装し、応答 JSON のフィクスチャーでテストします。

`release` / `track` の型は [応答スキーマ](response-schema.md) から `z.infer` で導出したものです。マッピングが読む項目はすべてスキーマに宣言し、フィクスチャーはテストでスキーマを `parse` してから渡します。

## 項目

| 項目 | 出どころ | 変換 |
| --- | --- | --- |
| title | `track.title` | そのまま。空なら `track.recording.title` |
| artist | `track["artist-credit"]` | `name` と `joinphrase` を連結 (例: `Artist X feat. Artist Y`) |
| albumArtist | `release["artist-credit"]` | 同上。`Various Artists` もそのまま |
| album | `release.title` | そのまま |
| year | `release.date` の先頭 4 桁 | 空なら `release["release-group"]["first-release-date"]` の先頭 4 桁。どちらもなければ `null` |
| track | `track.position` | 整数 |
| disc | `medium.position` | 整数 |
| genre | `release["release-group"].genres` → `release.genres` → `track.recording.genres` の順で最初に空でないもの | `count` 最大の `name`。先頭を大文字化 (`rock` → `Rock`) |
| composer | recording → work の relations (`work-rels`) をたどり、work の `artist-rels` で `type === "composer"` | 複数なら `, ` で連結 |
| lyricist | 同上で `type === "lyricist"` | 〃 |
| producer | recording の `artist-rels` で `type === "producer"` | 〃 |
| conductor | recording の `artist-rels` で `type === "conductor"` | 〃 |
| publisher | `release["label-info"][].label.name` | 先頭のレーベル名 |
| bpm / rating | なし | 候補に含めない ([スコープ](../scope.md)) |

- 該当する値がない項目は `null` にします。空文字にはしません (「MusicBrainz にない」と「削除」を区別するため)
- 連結に使う区切りは `, ` で固定します。DB は配列型タグを先頭要素だけ持つ方針 ([データベース](../../v1.0/architecture/database.md)) ですが、作曲者などの複数人を 1 文字列にまとめるのは一般的なタガー (Picard) と同じです
- アーティスト名は `artist-credit` の `name` (クレジット名) を使い、`artist.name` (正式名) は使いません。曲に書かれた表記に近いためです

## アートワーク

| 項目 | 出どころ |
| --- | --- |
| picture | Cover Art Archive のフロントカバー ([検索と照合](lookup-strategy.md))。`{ mimeType, data }`。`Content-Type` が `IMAGE_EXTENSION_BY_MIME` にない場合は画像なしとして扱う |

## 識別情報

候補には `recordingId` / `releaseId` (MBID) と検索 `score` を含めます。DB には保存しませんが ([スコープ](../scope.md))、取得ダイアログの完了表示とログで「どのリリースに照合したか」を示すために使います。
