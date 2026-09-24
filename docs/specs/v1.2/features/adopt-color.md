# 採用色の選定

Details タブ ([取得結果の比較と採用](music-info-compare.md)) と Artwork タブ ([Artwork タブ](artwork-compare.md)) で「採用される側」を示す枠線とフォーカス時の glow の色です。

## 要件

- ライト・ダーク両テーマで、通常の枠線 (`--input`) とフォーカス ring (`--ring`) から一目で区別できること
- エラー (`--destructive`、赤) と混同しないこと
- 「こちらが保存される」という肯定的な意味が伝わること

## 検討

| 候補 | 評価 |
| --- | --- |
| green 系 (提案どおり) | 「採用・成功」の意味が定着しており、赤のエラーと対になる。Parade のニュートラルは寒色寄り (hue 225〜240) なので、青緑寄りの green にすると馴染みつつ区別できる。**採用** |
| blue 系 | フォーカス ring (hue 230) と色相が近く、ライトテーマで「フォーカスしているだけ」と見分けにくい |
| amber 系 | 「注意」の意味が強く、採用の合図には不向き |
| `--primary` | Parade の primary はほぼ無彩色で、通常の枠線との差が小さい |

**結論: green 系のまま、色相を青緑寄り (hue 160 前後) に置いた専用トークンにします。** 既存のパレットに緑がないため、意味つきのトークンとして追加します。

## トークン

```css
/* src/renderer/App.css */
:root {
  --adopt: oklch(0.6 0.15 160);        /* light: 背景 (L 0.94) に対して十分なコントラスト */
}
.dark {
  --adopt: oklch(0.75 0.15 160);       /* dark: 背景 (L 0.145) に対して明るめ */
}
@theme inline {
  --color-adopt: var(--adopt);
}
```

- 名前は用途 (`adopt`) で付け、色名 (`green`) にはしません。将来色を変えてもクラス名が変わらないためです
- 枠線: `border-adopt`。フォーカス ring: `focus-visible:ring-adopt/40` + `focus-visible:border-adopt` (shadcn の `Input` が `aria-invalid` で destructive にしているのと同じ構造)
- 画像の枠 (Artwork タブ) も `border-adopt` で統一します
- チェックボックス自体の色は変えません (採用の対象は input / 画像であり、チェックボックスはその操作子)

## 確認方法

ライト・ダーク両方で、通常・採用・エラー・フォーカスの 4 状態を並べたスクリーンショットを PR に添付して確認します。エラーと採用が同時に立つ (左が invalid、右を採用) 場合は右だけ採用色、左は destructive のままです。
