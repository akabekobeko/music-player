# 技術選定

サイトの実装技術の選定です。

## 決定

**Astro (7.x) + Tailwind CSS v4 を採用し、UI フレームワーク (React など) は使いません。**

| 項目 | 採用 | 備考 |
| --- | --- | --- |
| フレームワーク | Astro 7 | 静的生成 (`output: "static"`)。調査時点 (2026-10) の最新は 7.3.8 |
| スタイル | Tailwind CSS v4 (`@tailwindcss/vite`) | アプリと同じ。`App.css` の配色トークンを共有する ([テーマとスタイル](theme.md)) |
| フォント | `@fontsource-variable/inter` | アプリと同じ Inter Variable |
| アイコン | `lucide-static` または `astro-icon` | アプリの lucide-react と同じ図形 |
| 画像 | Astro 組み込みの `<Image>` / `<Picture>` (sharp) | スクリーンショットを WebP / AVIF へ変換し、幅ごとに出力する |
| 多言語 | Astro 組み込みの i18n ルーティング | [多言語対応](i18n.md) |
| サイトマップ | `@astrojs/sitemap` | `hreflang` の alternate も生成する |
| 整形 / 検査 | biome (ルート設定)、`prettier-plugin-astro`、`astro check` | |

## Astro を選ぶ理由

- **既定でクライアント JavaScript を出さない。** 紹介サイトに必要な動的要素はテーマ切り替えと言語切り替えだけで、どちらも数十行の素の `<script>` で済む。React を載せる理由がない
- **ビルド時のデータ取得が自然に書ける。** `.astro` のフロントマターで `await fetch(...)` すれば、GitHub REST API の結果を静的 HTML に埋め込める ([リリース情報の取得](release-data.md))
- **i18n ルーティングと画像最適化が組み込み。** 追加のプラグインなしで `/` と `/ja/` の構成と、Retina スクリーンショットのレスポンシブ配信ができる
- **Tailwind v4 の Vite プラグインがそのまま使える。** アプリと同じ `@tailwindcss/vite` なので、配色トークン (`@theme`、`:root`、`.dark`) の定義をそのまま共有できる
- **GitHub Pages への公開手順が公式に整備されている。** [Deploy your Astro Site to GitHub Pages](https://docs.astro.build/en/guides/deploy/github/) に `site` / `base` の設定とワークフロー例がある

## 他の候補

| 候補 | 評価 | 見送る理由 |
| --- | --- | --- |
| VitePress (1.6) | ドキュメント サイトには最適。Vue ベース | 既定テーマがドキュメント向けで、ランディング ページとダウンロード ページは独自レイアウトを書くことになる。ドキュメント サイトを作らない今回は利点が薄い |
| Vite + React (アプリと同じ構成) | アプリの shadcn/ui コンポーネント (`Button` など) を再利用できる | 静的生成 (SSG) の仕組みがなく、`vite-plugin-ssr` 相当を自前で組む。多言語ルーティングと画像最適化も自前。再利用したいコンポーネントは `GlowIconButton` 程度で、CSS を写すほうが軽い |
| Next.js (static export) | React、画像最適化、i18n | 紹介サイト 2 ページには過剰。static export では `next/image` の最適化が使えず、`base` 相当の `basePath` の扱いも GitHub Pages で注意が要る |
| Eleventy | 軽量な静的生成 | TypeScript とコンポーネントが一級でなく、画像最適化と i18n はプラグインの組み合わせになる。アプリと技術を揃えられない |
| Docusaurus | React、i18n、バージョン付きドキュメント | ドキュメント サイト向け。ランディング ページのカスタマイズは可能だがビルドが重く、依存が多い |
| 素の HTML + CSS | 依存ゼロ | 多言語の 2 ページ分の HTML を手で同期することになり、リリース情報の埋め込みも自前のスクリプトになる。Astro との差は依存の有無だけで、保守性で劣る |

## UI フレームワークを使わない理由

アプリのコンポーネント (shadcn/ui + React) をサイトで再利用する案も検討しましたが、次の理由で見送ります。

- 再利用したい見た目は配色、glow、角丸、フォントで、これらは CSS だけで共有できる ([テーマとスタイル](theme.md))
- shadcn/ui のコンポーネントは Base UI に依存し、Electron 専用 (`chrome152` ターゲット) の前提で書かれている箇所がある。ブラウザー向けに別ビルドを設けると、アプリ側の変更がサイトを壊す結合になる
- サイトの対話要素 (テーマ切り替え、言語切り替え、OS 判定によるボタンの強調) は素の `<script>` で十分

将来、対話的な UI (例: スクリーンショットのギャラリー) が必要になったら、Astro の islands で React を部分的に載せられます。
