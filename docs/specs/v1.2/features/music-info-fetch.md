# 曲情報ダイアログの取得ボタン

曲情報ダイアログ (`MusicInfoDialog`) の Footer 左端に「曲情報の取得」ボタンを追加します。押すと `mp:musicbrainz:lookupMusic` ([IPC 設計](../architecture/ipc.md)) で候補を取得し、Details タブと Artwork タブを比較表示に切り替えます ([Details タブ](music-info-compare.md)、[Artwork タブ](artwork-compare.md))。

## 画面構成

```
┌ Song Info ───────────────────────────────────────┐
│ [Details] [Artwork] [File]                        │
│ ...                                               │
│ [⟳ Fetch]  適用すると再生を停止します   [Cancel] [Apply] │
└───────────────────────────────────────────────────┘
```

- ボタンは `DialogFooter` の `leading` に置き、v1.1 の注意文 (`willStopPlayback`) と `HStack` で並べます
- 見た目は `outline` の小ボタン。アイコンは `CloudDownload`、実行中は `Loader2` のスピナーに差し替えます
- ラベルは i18n `musicInfo.fetch` (en: `Fetch`、ja: `曲情報の取得`)。tooltip に「MusicBrainz から曲情報を取得」

## 活性条件

| 状態 | ボタン |
| --- | --- |
| 対象が 1 曲 | 活性 |
| 対象が複数曲 | 非活性 (合成表示に対して 1 曲の候補を当てる意味がないため) |
| 取得中 | 非活性 (スピナー) |
| 適用中 | 非活性 |

取得中は Apply / Cancel も非活性にします。取得結果を待たずに適用や閉じる操作が走ると、候補の画像とフォームの整合が崩れるためです。

## 実行

```
fetch():
  1. fetching = true、前回の候補と採用状態を破棄
  2. mp:musicbrainz:lookupMusic({ musicId }) を invoke
  3. 応答を処理
       ok: false          → エラー文言を表示 (下記)
       value: null        → 「MusicBrainz に該当する曲が見つかりませんでした」を表示
       value: candidate   → candidate を保持し、採用の既定値を計算して比較表示へ
  4. fetching = false
```

- 何度でも押し直せます。押し直すと前回の候補と採用状態は破棄され、フォームの現在値は保持されます
- 候補の画像 (`Uint8Array`) は Renderer のメモリー上に置き、ダイアログを閉じるかコンポーネントがアンマウントされたら参照を捨てます。ファイルには書きません ([Artwork タブ](artwork-compare.md))

## 文言

エラーと「該当なし」は Details タブの下 (v1.1 の適用失敗と同じ位置) に表示し、次の取得か適用で消します。

| 状況 | 文言 (ja) |
| --- | --- |
| 該当なし | MusicBrainz に該当する曲が見つかりませんでした |
| `MB_NETWORK` / `MB_TIMEOUT` | MusicBrainz に接続できませんでした。ネットワーク接続を確認してください |
| `MB_THROTTLED` | MusicBrainz が混み合っています。しばらく待ってから再試行してください |
| その他 | 曲情報の取得に失敗しました: {message} |

## 適用との関係

- 採用チェックボックスが 1 つでもオン、または画像を採用していれば「変更あり」として Apply を活性化します。判定の詳細は [Details タブ](music-info-compare.md)
- 適用時は、採用した項目の値を候補から取り、それ以外はフォームの現在値を使って `toMusicTagPatch` に渡します。画像は採用していれば `picture` に候補の `{ mimeType, data }` を載せます。以降は v1.1 の [適用処理](../../v1.1/features/apply-flow.md) と同じです
