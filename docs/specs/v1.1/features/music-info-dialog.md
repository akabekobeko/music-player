# 曲情報ダイアログの編集

曲メニュー「Song info」で開く `MusicInfoDialog` を編集可能にします。v1.0 のダイアログ (Details / Artwork / File の 3 タブ) の構成は維持し、Details タブの入力欄を編集可能にして適用ボタンを足します。

## 画面構成

```
┌ Song Info ───────────────────────────────┐
│ [Details] [Artwork] [File]               │
│ Title        [My Song                  ] │
│ Artist       [Artist Name              ] │
│ Album artist [                         ] │
│ ...                                      │
│ Year         [2001]   ← エラーは項目の直下 │
│                                          │
│ 適用に失敗しました: ... (失敗時のみ)       │
│                          [Cancel] [Apply] │
└──────────────────────────────────────────┘
```

- タイトルは単曲なら「Song Info」、複数選択なら「Song Info (N songs)」
- Details タブ: 15 項目の入力欄を編集可能にする。項目と制約は [編集項目と validation](music-info-fields.md)
- Artwork タブ: 画像ファイルの選択と削除で差し替えられる ([アートワークの編集](artwork-edit.md))
- File タブ: 単曲は v1.0 と同じ。複数選択では対象曲の一覧 (タイトルとファイルパス) を表示する
- フッターは Cancel と Apply。Apple Music に倣い Apply が primary、Cancel が outline

## 適用ボタンの活性条件

**変更があり、かつ validation エラーがないときだけ活性化します。** 変更とは、タグ項目の変更またはアートワークの編集です。

- 初期状態 (開いた直後) は非活性
- 各項目の現在値を初期値と比較し、1 つでも異なれば「変更あり」。編集して元の値に戻せば「変更なし」に戻る。判定には TanStack Form の `isDefaultValue` を使う ([form ライブラリー選定](../architecture/form-library.md))
- 複数選択の「ミックス」項目の判定は [複数選択の編集](multi-edit.md)
- アートワークはフォームの外で `pictureChange` として持ち、`null` 以外なら「変更あり」とする ([アートワークの編集](artwork-edit.md))
- validation は入力のたび (onChange) に行い、エラーは項目の直下に赤字で表示する。エラーがある間は Apply を非活性にする
- 適用中は Apply / Cancel とも非活性にし、Apply にスピナーを出す ([適用処理](apply-flow.md))

## 閉じる操作

- Cancel / Esc / 背景クリックで閉じる。未適用の変更は破棄する (確認ダイアログは v1.1 では出さない。[スコープ](../scope.md))
- 適用中は閉じられない
- 適用が成功すると自動で閉じる。失敗があれば開いたままエラーを表示する ([適用処理](apply-flow.md))
- ヘッダー右上の閉じる (×) ボタンは置かない (アルバム情報・アーティスト情報のダイアログも同様)。前後移動のボタンをヘッダー右端に置くため、誤クリックで閉じないようにする

## 前後移動

曲情報ダイアログとアルバム情報ダイアログのヘッダー右端に、開いた元の一覧を前後にたどるボタンを置きます。

- 表示するのは単一の曲・アルバムを表示しているときだけ。複数選択の曲情報では表示しない
- Lucide の `ChevronLeft` / `ChevronRight` のアイコンボタン。hover で頭文字インデックスのタイル (`InitialGrid`) と同じく枠線がぼかし付きで発光する
- 前後の曲・アルバムがなければ、その側のボタンを非活性にする。曲情報ダイアログでは適用中と曲情報の取得中も両方のボタンを非活性にする
- クリックで表示を前後の曲・アルバムに切り替える。曲情報ダイアログでは編集内容を保存せずに破棄する (ダイアログ自体は閉じず、開いているタブは維持する)
- 一覧の元は開いたビューの表示順: Artist ビューはアーティストの再生順 (曲) と表示中のアルバム、Album ビューはグリッドのアルバムと展開中アルバムの曲、Playlist ビューは表示中の行の曲 (同じ曲が複数行にあれば 1 回だけ数える)。一覧はダイアログを開いた時点のスナップショット
- 実装: `musicInfoStore.open(musics, siblings)` / `albumInfoStore.open(album, siblings)` が一覧を受け取り、`previous()` / `next()` で表示対象を差し替える。位置の計算は `dialogNavigation.ts` の純関数

## 実装

- ロジックは `useMusicInfoDialog` に分離する ([コーディングルール](../../../coding-rules/README.md))。フォーム生成、初期値の合成、適用、閉じる処理をここに置く
- `musicInfoStore` の subject を `Music` から `readonly Music[]` に変え、単曲は長さ 1 の配列とする
- `TagField` は `readOnly` を外し、`value` / `onChange` / `error` / `placeholder` を受ける controlled な部品にする。Base UI の `Input` はそのまま使う
- 数値項目は `type="number"` ではなく `inputMode="numeric"` のテキスト入力にし、変換は純関数で行う (ブラウザーの number 入力は空欄と不正値の区別が曖昧なため)
