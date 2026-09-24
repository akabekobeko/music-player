# 不足しているメタデータの定義

メニューからの一括取得 ([メニューからの取得](fetch-menu.md)) は**不足している項目だけ**を補完し、既存の値は変更しません。「不足」の判定は純関数 `missingFieldsOf(music): ReadonlySet<keyof MusicInfoCandidateTags>` と `missingPatchOf(music, candidate): { patch, picture }` で行い、テストを並置します。

## 項目ごとの条件

| 項目 | 不足とみなす条件 | 備考 |
| --- | --- | --- |
| title | 不足とみなさない | インポート時にファイル名で補完済みのため常に値がある。ファイル名由来かどうかは判別できず、上書きはダイアログで行う |
| artist / albumArtist / album / genre | 空文字 | |
| composer / lyricist / producer / conductor / publisher | 空文字 | |
| year | `null` | |
| track | `0` | DB の既定値 = 未設定 |
| disc | `track` が不足しているとき | `disc` の既定値 `1` は「1 枚目」と「未設定」を区別できない。トラック番号と同時に medium から得るため、track と組で補完する |
| bpm / rating | 不足とみなさない | 候補に値がない ([スコープ](../scope.md)) |
| アートワーク | `picturePath` が `null` | 候補に画像があれば `picture` に載せる |

## patch の組み立て

```
patch = {}
for each field in missingFieldsOf(music):
  if candidate.tags[field] !== null: patch[field] = candidate.tags[field]
picture = music.picturePath === null && candidate.picture !== null ? candidate.picture : undefined
```

- 候補の値が `null` (MusicBrainz にもない) の項目は patch に含めず、ファイルの値を変更しません
- `patch` と `picture` の両方が空なら書き込みを行わず `unchanged` にします ([一括取得の処理](../architecture/fetch-run.md))
- 文字列は `MusicTagPatch` の規則どおり trim して載せます。空文字になる値は載せません (削除の意味になるため)

## ダイアログでの既定値との関係

曲情報ダイアログの採用チェックボックスの既定値 ([Details タブ](music-info-compare.md)) も同じ `missingFieldsOf` を使います。「現在の input が空なら既定でチェック」の「空」はこの表の条件と一致させ、一括取得とダイアログで補完される項目が食い違わないようにします。
