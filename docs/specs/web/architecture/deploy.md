# デプロイ

GitHub Pages への公開ワークフローと、リリース フローとの連携です。

## 公開先

- URL: `https://akabekobeko.github.io/parade/` (project site)
- `astro.config.ts` は `site: "https://akabekobeko.github.io"`、`base: "/parade"` とする。内部リンクと画像のパスは `import.meta.env.BASE_URL` を前置する (Astro 公式ガイドの project site の手順)
- リポジトリー設定で Pages の Source を **GitHub Actions** にする (人手で 1 回だけ)。調査時点では Pages は未設定

## ワークフロー `pages.yml`

`.github/workflows/pages.yml` を新設します。`withastro/action` は使わず、ルートで `pnpm install` してから `web/` をビルドする自前の手順にします (workspace のルートに lockfile があるため。既存の `ci.yml` / `release.yml` と手順を揃えられる)。

```yaml
name: Pages

on:
  push:
    branches: [main]
    paths: ["web/**", ".github/workflows/pages.yml"]
  workflow_run:
    workflows: [Release]
    types: [completed]
  workflow_dispatch:

permissions:
  contents: read

concurrency:
  group: pages
  cancel-in-progress: false

jobs:
  build:
    # Skip when the Release workflow failed, so the site never points at a
    # release whose assets are missing.
    if: github.event_name != 'workflow_run' || github.event.workflow_run.conclusion == 'success'
    runs-on: ubuntu-latest
    timeout-minutes: 10
    steps:
      - uses: actions/checkout@<sha> # v7
        with:
          persist-credentials: false
      # Read tool versions from mise.toml, pnpm/action-setup, actions/setup-node:
      # same steps as ci.yml
      - run: pnpm install --frozen-lockfile
        env:
          ELECTRON_SKIP_BINARY_DOWNLOAD: "1"
      - run: pnpm --filter parade-web build
        env:
          # Authenticated requests to the GitHub REST API (5,000 per hour)
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
      - uses: actions/upload-pages-artifact@<sha> # v5
        with:
          path: web/dist

  deploy:
    needs: build
    runs-on: ubuntu-latest
    timeout-minutes: 5
    permissions:
      pages: write
      id-token: write
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    steps:
      - id: deployment
        uses: actions/deploy-pages@<sha> # v5
```

- action は既存ワークフローと同じく commit SHA で固定し、コメントにバージョンを書く。調査時点の最新は `actions/upload-pages-artifact` v5.0.0、`actions/deploy-pages` v5.0.1、`actions/configure-pages` v6.0.0 (`site` / `base` は `astro.config.ts` に直書きするため `configure-pages` は使わない)
- `ELECTRON_SKIP_BINARY_DOWNLOAD` はルートの `pnpm install` で Electron のバイナリーを落とさないため (`ci.yml` と同じ)
- `concurrency.cancel-in-progress` は `false`。公開中のデプロイを中断しないため

## 公開の契機

| 契機 | 用途 |
| --- | --- |
| `push` (main、`web/**` の変更) | サイトの変更を公開する。`paths` でアプリだけの変更では走らない |
| `workflow_run` (Release の完了) | 新バージョンのアセットをダウンロード ページへ反映する。Release ワークフローはアセットの添付までを行うので、完了時点で API から新しいアセットを取得できる |
| `workflow_dispatch` | 手動の再公開。API の一時障害でビルドが失敗したときなどに使う |

`release.yml` は `GITHUB_TOKEN` で main へ push するため、その push では `pages.yml` の `push` は起動しません (GitHub の仕様)。`workflow_run` はワークフローの完了そのものを契機にするので、この制約を受けずに起動します。

`workflow_run` で起動したときのチェックアウトは main の最新です。Release ワークフローが main へ入れたバージョン更新 commit (`chore: vX.Y.Z`) を含むので、サイトが参照するアプリの情報 (もしあれば) も新バージョンに揃います。

## リリース フロー側の変更

`release.yml` は変更しません。`docs/release.md` の全体の流れに「Release の完了後に Pages ワークフローが起動してサイトを再公開する」を追記します。

## ローカルでの確認

公開前の確認は[ローカル プレビュー](local-preview.md)の手順で行います。GitHub Pages には PR ごとのプレビュー環境がないため、main へマージする前にビルドのプレビュー (`astro preview`) で確認項目を通します。

## CI

`ci.yml` に `web/**` の変更時だけ走る job を追加し、`astro check` (型検査) と `astro build` を実行し、`web/dist/` を成果物として保存します。ビルド時の API 呼び出しには `GITHUB_TOKEN` を渡します。fork からの PR では `secrets.GITHUB_TOKEN` が読み取り専用になりますが、公開リポジトリーの Releases の参照には十分です。
