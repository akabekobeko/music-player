# テーマとスタイル

アプリの配色を踏襲したダーク / ライト テーマと、hover 時の glow 効果の実装方針です。

## 配色トークンの共有

アプリの配色は `src/renderer/App.css` の `:root` (ライト) と `.dark` (ダーク) に oklch で定義されています。`App.css` は分割せず、サイト側へ**コピー**して使います。

1. `App.css` の `:root { --background: ...; }` と `.dark { ... }` のトークン ブロックを `web/src/styles/tokens.css` へそのまま写す。先頭のコメントに「`src/renderer/App.css` のコピー。アプリの配色を変えたら手で同期する」と書く
2. Tailwind の `@theme inline` によるトークンとユーティリティの対応 (`--color-background: var(--background)` など) は、サイト側で必要な分だけ `web/src/styles/global.css` に書く
3. アプリ側の `App.css` のトークン ブロックにも「`web/src/styles/tokens.css` にコピーがある」旨のコメントを 1 行足し、変更時に気づけるようにする (CSS のコメント追加のみで、分割や `@import` の変更はしない)

アプリと別ファイルになるため、配色の変更はサイトへ自動では追従しません。`App.css` のコメントで同期を促すほか、[スクリーンショット](../features/screenshots.md) の撮り直しと同じ契機 (配色を変える PR) で `tokens.css` も更新します。`--adopt` や `--chart-*` などサイトで使わないトークンはコピーから省いてよいですが、同期しやすさを優先して全部写します。

サイト固有の値 (ヘッダーの高さ、コンテンツの最大幅) は `global.css` の `:root` に置き、`tokens.css` には足しません。

## ダーク / ライトの切り替え

アプリと同じく `<html>` の `.dark` クラスで切り替えます (`@custom-variant dark (&:is(.dark *))`)。

- 既定は OS の設定 (`prefers-color-scheme`)。アプリの「System」と同じ
- ヘッダーのテーマ切り替えボタンは全ページ・全画面幅で常時表示する ([ページ構成](../features/pages.md))。System → Light → Dark の 3 状態ではなく、Light / Dark のトグルにする。選んだ値を `localStorage` の `theme` に保存し、保存がなければ OS に従う
- JavaScript が無効な環境ではボタンを押しても切り替わらない。この場合も OS の設定に従った表示になるので、ボタンは `<button>` のまま残し、非表示や置き換えはしない
- 初期描画のちらつき (FOUC) を防ぐため、`<head>` のインライン `<script is:inline>` で `localStorage` と `matchMedia` を読んで `.dark` を付ける。この処理は描画前に同期で走らせる
- OS の設定が変わったときは、保存がない場合だけ追従する (`matchMedia` の `change` イベント)。アプリの `watchSystemTheme` と同じ
- `<meta name="color-scheme" content="dark light">` を出し、スクロールバーなどのブラウザー UI も追従させる
- ボタンのアイコンは現在のテーマに応じて Sun / Moon (lucide) を切り替え、`aria-label` と `aria-pressed` を付ける

## glow 効果

アプリの hover 効果をそのまま CSS に写します。アプリには 2 種類あり、サイトでも使い分けます。

| 種類 | アプリでの用途 | サイトでの用途 | CSS |
| --- | --- | --- | --- |
| Lamp glow (`GlowIconButton`) | プレーヤー バーとツールバーのアイコン ボタン | ヘッダーのアイコン ボタン (テーマ切り替え、GitHub リンク)、ナビゲーション リンク | `filter: drop-shadow(0 0 5px var(--foreground)) drop-shadow(0 0 12px color-mix(in oklch, var(--foreground) 60%, transparent))` を svg (またはテキスト) に適用。`transition: filter 200ms` |
| Border glow (`CircleIconButton`、`Button` の outline / secondary) | 枠線つきのボタン、フォーム部品 | ダウンロード ボタン、カード | `border-color: var(--foreground)` と `box-shadow: 0 0 5px 1px color-mix(in oklch, var(--foreground) 60%, transparent)`。`transition: color, background-color, border-color, box-shadow 200ms` |

- `Button` の `default` variant (塗りつぶし) は `--primary` で光る: `box-shadow: 0 0 5px 1px color-mix(in oklch, var(--primary) 60%, transparent)`。ダウンロード ページの主ボタンに使う
- ナビゲーション リンクの現在ページは、アプリのサイドバーの active タブと同じく塗りつぶし (`bg-foreground text-background`) で示し、hover の glow は付けたままにする
- `prefers-reduced-motion: reduce` では transition を切る (glow 自体は残す)
- Tailwind のユーティリティとして `@utility glow-lamp` / `@utility glow-border` を `global.css` に定義し、`.astro` 側では `hover:glow-lamp` のように使う

## その他の外観

- フォント: Inter Variable (`@fontsource-variable/inter`)。見出しも同じ (アプリの `--font-heading`)
- 角丸: `--radius: 0.625rem` とその派生 (`--radius-sm` など) をアプリと同じ比率で定義する
- アイコン: lucide。アプリと同じ図形を使い、サイズは 16 / 20 / 24 px
- 画像の枠: スクリーンショットは macOS のウィンドウ影を含めて撮影するので、サイト側では枠や影を付けない ([スクリーンショット](../features/screenshots.md))
- 背景: ライトは `--background` (くすんだ銀)、ダークは `--background` (ほぼ黒)。ヒーロー領域にグラデーションを足す場合は `--card` との差の範囲に収め、トークン以外の色を導入しない
