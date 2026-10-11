# 公式サイト

Parade の公式サイト (GitHub Pages) の仕様書です。アプリの機能紹介と、GitHub Releases で公開しているリリース用イメージをプラットフォームごとにわかりやすく提供することを目的とします。

## テーマ

**アプリを知らない人が、機能を理解して自分の OS 向けのイメージを迷わずダウンロードできるサイトを、リリース フローに追従する形で運用する。**

- トップ ページでアプリの概要、主な機能、代表的な画面のスクリーンショットを見せる
- ダウンロード ページで最新バージョンのイメージをプラットフォーム別に提示する。過去バージョンは GitHub Releases へ誘導する
- 英語を既定とし、ヘッダーから日本語へ切り替えられる
- 固定ヘッダー、コンテンツ、フッターの 3 領域で構成し、アプリの配色を踏襲したダーク / ライト テーマと hover 時の glow 効果を持つ。テーマと言語の切り替えはヘッダーの UI として常時表示する
- スクリーンショットはデモ モード ([docs/demo](../../demo/README.md)) で macOS の英語 UI だけを撮影する。日本語対応は文章で明記する
- フッターにライセンス (MIT) と、利用サービスとして MusicBrainz / Cover Art Archive を併記する

## 決定事項

| 項目 | 決定 | 根拠 |
| --- | --- | --- |
| リポジトリー | 現在のリポジトリーの `web/` ディレクトリー | [リポジトリー構成](architecture/repository.md) |
| 実装技術 | Astro + Tailwind CSS v4 (静的生成、UI フレームワークなし) | [技術選定](architecture/tech-stack.md) |
| 公開先 | GitHub Pages (`https://akabekobeko.github.io/parade/`) | [デプロイ](architecture/deploy.md) |
| 最新リリースの取得 | ビルド時に GitHub REST API から取得して静的 HTML に埋め込む | [リリース情報の取得](architecture/release-data.md) |
| 言語 | 英語 (`/`) を既定、日本語 (`/ja/`) へ切り替え | [多言語対応](architecture/i18n.md) |
| ページ | トップ、ダウンロード、404 の 3 ページ | [ページ構成](features/pages.md) |
| 配色 | `src/renderer/App.css` のトークンを `web/` へコピー (アプリ側は分割しない) | [テーマとスタイル](architecture/theme.md) |
| スクリーンショット | macOS、英語 UI、ダーク基調 (ライトは 1 枚) | [スクリーンショット](features/screenshots.md) |

## 仕様書の構成

アプリの各バージョンと同じく、エントリーポイントを README、機能仕様を `features/` に置きます。1 ファイルの分量は日本語換算 1,000 文字を目安とし、超える場合は項目ごとに分割して分割元からリンクします。

### 計画

- [スコープ](scope.md)
  - やること・やらないこと
- [ロードマップ](roadmap.md)
  - 実装フェーズの分割と順序

### アーキテクチャー

- [リポジトリー構成](architecture/repository.md)
  - 同一リポジトリーと別リポジトリーの比較、リリース アセットへリンクする際のライセンス調査
- [技術選定](architecture/tech-stack.md)
  - Astro の採用理由と他の候補の比較
- [デプロイ](architecture/deploy.md)
  - GitHub Pages への公開ワークフローとリリース フローとの連携
- [ローカル プレビュー](architecture/local-preview.md)
  - 公開前にローカルで確認する手順 (開発サーバー、ビルドのプレビュー、確認項目)
- [リリース情報の取得](architecture/release-data.md)
  - GitHub REST API からの取得、アセットの分類規則、取得失敗時の扱い
- [多言語対応](architecture/i18n.md)
  - ルーティング、辞書、言語の切り替え
- [テーマとスタイル](architecture/theme.md)
  - アプリの配色トークンの共有、ダーク / ライト切り替え、glow 効果

### 機能仕様

- [ページ構成](features/pages.md)
  - ページの一覧と URL、共通レイアウト (ヘッダー / コンテンツ / フッター)
- [トップ ページ](features/top-page.md)
  - 概要、主な機能、スクリーンショットの構成
- [ダウンロード ページ](features/download-page.md)
  - プラットフォーム別の提示、インストール時の注意、過去バージョンへの誘導
- [スクリーンショット](features/screenshots.md)
  - デモ モードでの撮影手順、撮影する画面の一覧、ファイル パスのマスク

## 運用

公開済みのサイトは <https://akabekobeko.github.io/parade/> (日本語は `/ja/`) で、リポジトリーの README と GitHub の About からリンクしています。

サイトの変更はアプリと同じ PR フローで行います。ブランチ接頭辞は内容に応じて `feat/` `fix/` `docs/` `chore/` を使い、Release Notes には他の PR と同じカテゴリーで載ります。サイトだけの変更でもリリースを打つ必要はなく、main へのマージで自動公開されます ([デプロイ](architecture/deploy.md))。
