# 取得結果の比較と採用 (Details タブ)

曲情報ダイアログで取得 ([曲情報ダイアログの取得ボタン](music-info-fetch.md)) が成功すると、Details タブの各項目を「現在の値」と「取得した値」の 2 列で表示し、項目ごとに採用を選べるようにします。

## 画面構成

```
              現在                     MusicBrainz
Title        [Survivalism         ]  [Survivalism         ] [ ]
Artist       [                    ]  [Nine Inch Nails     ] [x]   ← 現在が空なので既定で採用
Album artist [NIN                 ]  [Nine Inch Nails     ] [ ]
...
BPM          [                    ]  [                    ] [ ]   ← 候補なし: 非活性
```

- 左列は v1.1 と同じ編集可能な `TagField`。右列は `readOnly` の `Input` で、候補が `null` の項目は空欄 + placeholder「—」
- 右端に採用チェックボックス (`Checkbox`、ラベルなし、`aria-label` は「<項目名> に取得した値を採用」)。候補が `null` の項目はチェックボックスも非活性
- bpm / rating は候補を持たないため、右列は空欄・チェックボックス非活性のまま列を揃えます
- 列見出し「現在」「MusicBrainz」を先頭行に出します。取得前は 1 列のまま (v1.1 の表示) で、見出しも出しません
- 横幅が足りない場合 (`sm`) は 2 列を縦に積まず、ダイアログの `max-w` を広げて 2 列を維持します。比較が目的のため縦積みは避けます

## 採用チェックボックスの規則

採用状態 `adopted: Record<field, boolean>` はフォームの外に持ちます (v1.1 の `pictureChange` と同じ扱い)。

| 事象 | 採用状態 |
| --- | --- |
| 取得直後 (既定値) | 現在の値が不足 ([不足しているメタデータの定義](missing-fields.md)) かつ候補が `null` でない項目はオン、それ以外はオフ |
| ユーザーがチェックを切り替える | その値 |
| 現在の input を編集する | その項目をオフ (編集した値を優先する意思とみなす) |
| 取得ボタンを押し直す | 破棄して既定値を再計算 |

- 既定値の「不足」は一括取得と同じ関数 `missingFieldsOf` で判定します。フォーム上は「trim 後に空文字」が不足に相当します (year / bpm / rating の空欄も同様、track は `"0"` も不足)
- 現在の input を編集すると自動でオフになりますが、その後チェックを入れ直すことはできます。再び編集すればまたオフです

## 採用側の明示

どちらの値が保存されるかを枠線色で示します。

- 採用チェックがオフ: 左 (現在) の input の枠線を採用色に、右は通常の枠線
- 採用チェックがオン: 右 (取得) の input の枠線を採用色に、左は通常の枠線
- 採用色の input はフォーカス時の ring (glow) も同じ色相にします
- 候補が `null` の項目は左を採用色にします (現在の値がそのまま残るため)。取得前の 1 列表示では枠線色を変えません

採用色の具体値は [採用色の選定](adopt-color.md) を参照してください。

## 変更判定と適用

「変更あり」の判定は、v1.1 の `isDefaultValue` に採用状態を加えます。

```
effectiveValues = { ...form.values, ...(adopted な項目は候補の値を文字列化したもの) }
changed = diffFormValues(initialValues, effectiveValues) が空でない || 画像の変更あり
```

- 採用がオンの項目は現在の input の内容にかかわらず候補の値が保存されます。左の input は編集可能なままですが、編集した時点で採用がオフになるため矛盾は起きません
- validation は左の input の値に対して行います。採用がオンの項目は候補の値で置き換わるため、左の値のエラーは適用を止めません (エラー表示は残す)
- 候補の数値項目 (year / track / disc) は文字列化してフォーム値と同じ形にし、`toMusicTagPatch` へ渡します。rating の 5 段階変換などは v1.1 の規則をそのまま通します

## 実装

- `useMusicInfoDialog` に `candidate` / `adopted` / `fetching` / `fetchError` を追加し、`effectiveValues` と `setAdopted` / `toggleAdopted` を返します
- `TagField` を拡張せず、2 列版の `CompareTagField` (左 `TagField` 相当 + 右 read-only `Input` + `Checkbox`) を `MusicInfoDialog/` 配下に追加します。取得前は従来の `TagField` を描画し、取得後に `CompareTagField` へ切り替えます
- 採用の既定値計算 `defaultAdoptedOf(values, candidate)` と `effectiveValuesOf(values, candidate, adopted)` は純関数としてテストを並置します
