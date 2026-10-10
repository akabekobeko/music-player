# ロードマップ

公式サイトの実装フェーズです。アプリのバージョンとは独立して進めます。GitHub の Milestone は `web` とし、issue のタイトル接頭辞を `[Phase N]` にします。

## Phase 1: 基盤

公開できる最小のサイトを作り、以後のフェーズを main へのマージだけで公開できる状態にします。

- `web/` を Astro で作成し、pnpm workspace のパッケージにする ([リポジトリー構成](architecture/repository.md))
- 共通レイアウト (固定ヘッダー、コンテンツ、フッター、MusicBrainz のクレジット) と 404 ページ ([ページ構成](features/pages.md))
- アプリの配色トークンのコピー、ダーク / ライト テーマ、glow 効果 ([テーマとスタイル](architecture/theme.md))
- 英語 / 日本語のルーティングと辞書、言語切り替え ([多言語対応](architecture/i18n.md))
- GitHub Pages への公開ワークフロー (`pages.yml`) と、リポジトリー設定 (Pages の Source を GitHub Actions にする) ([デプロイ](architecture/deploy.md))
- ローカル プレビューの手順と `ci.yml` でのビルド成果物の保存 ([ローカル プレビュー](architecture/local-preview.md))
- トップ ページはプレースホルダー (概要の文章と GitHub リンクのみ)

完了条件: `https://akabekobeko.github.io/parade/` と `/ja/` が表示され、テーマと言語の切り替えが動く。

## Phase 2: ダウンロード ページ

- ビルド時に GitHub REST API から最新リリースを取得し、アセットを分類する ([リリース情報の取得](architecture/release-data.md))
- ダウンロード ページの UI (プラットフォーム別のカード、その他の形式、インストール時の注意) ([ダウンロード ページ](features/download-page.md))
- Release ワークフローの完了で公開ワークフローを起動する ([デプロイ](architecture/deploy.md))
- トップ ページのダウンロード ボタンをダウンロード ページへつなぐ

完了条件: 次のリリースを Publish すると、人手の操作なしにダウンロード ページの表示が新バージョンへ切り替わる。

## Phase 3: スクリーンショットとトップ ページ

- デモ モードでスクリーンショットを撮影し、マスクを施して `web/` へ格納する ([スクリーンショット](features/screenshots.md))
- トップ ページの本実装 (ヒーロー、主な機能、スクリーンショット) ([トップ ページ](features/top-page.md))
- 日本語の文言

完了条件: トップ ページが英語 / 日本語で完成し、画面のスクリーンショットに個人情報が含まれない。

## Phase 4: 仕上げ

- OGP 画像、favicon、`sitemap.xml`、`robots.txt`、`hreflang`
- Lighthouse による計測と改善 ([スコープ](scope.md) の非機能要件)
- リポジトリーの README と GitHub の About (Website) からサイトへリンクする
- 日本語の訪問者向けに、トップ ページで `navigator.language` が `ja` のときだけ日本語版への案内バナーを表示する (任意。リダイレクトはしない)

## 以降の候補

- Starlight によるドキュメント サイトの追加
- 独自ドメイン
- 各アセットのチェックサム (`SHA256SUMS`) をリリースに添付し、ダウンロード ページに表示する (アプリ側のリリース フローの変更が必要)
