# 検索クエリー

MusicBrainz の検索は Lucene 構文です ([MusicBrainz API / Search](https://musicbrainz.org/doc/MusicBrainz_API/Search))。Parade はフィールド指定つきの AND 検索を純関数で組み立てます。

## エスケープ

検索語は `escapeLucene` で Lucene の特殊文字をエスケープしてから二重引用符で囲みます。URL エンコードはこれとは別に `URLSearchParams` が行います。

```
+ - && || ! ( ) { } [ ] ^ " ~ * ? : \ /
```

## release 検索 (`buildReleaseQuery`)

| 条件 | クエリー | 備考 |
| --- | --- | --- |
| アルバム名 | `release:"<album>"` | 必須 |
| アルバム アーティスト | `artist:"<albumArtist or artist>"` | 表示アーティストが空 (Unknown Artist) なら付けない |
| トラック数 | `tracks:<N>` | グループの曲数が release のトラック数と一致するとは限らない (一部だけ選択した場合) ため**付けない**。照合はスコアと lookup 後のトラック数で行う |

例: `release:"Year Zero" AND artist:"Nine Inch Nails"`

## recording 検索 (`buildRecordingQuery`)

| 条件 | クエリー | 備考 |
| --- | --- | --- |
| タイトル | `recording:"<title>"` | 必須。タイトルがファイル名由来 (インポート時の補完) でもそのまま使う |
| アーティスト | `artist:"<artist>"` | `artist` が空なら `albumArtist`、両方空なら付けない |
| アルバム | `release:"<album>"` | 空なら付けない |
| 再生時間 | `dur:[<ms - 5000> TO <ms + 5000>]` | `durationMs` が 0 なら付けない |
| トラック番号 | `tnum:<track>` | `track > 0` のときだけ |

例: `recording:"Survivalism" AND artist:"Nine Inch Nails" AND release:"Year Zero" AND dur:[257000 TO 267000] AND tnum:2`

- 条件が多いほど誤マッチは減りますが、タグの誤りで 0 件になる可能性が増えます。0 件のときは `dur` と `tnum` を外して 1 回だけ再検索します (リクエストは最大 2 回)
- `dismax=true` は使いません (フィールド指定の構文が無効になるため)

## テスト

- `escapeLucene` は特殊文字の網羅と、日本語・絵文字がそのまま通ることを検証します
- `buildReleaseQuery` / `buildRecordingQuery` は空フィールドの省略と、再検索用の緩和クエリーを検証します
