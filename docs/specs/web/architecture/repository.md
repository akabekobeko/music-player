# リポジトリー構成

サイトのソースを現在のリポジトリーに置くか、別リポジトリーにするかの比較と決定です。

## 決定

**現在のリポジトリーの `web/` ディレクトリーに置きます。** 別リポジトリー (`parade-web`) にする場合の障害はリリース フローとの連携にあり、ライセンスには問題がありません。

## 比較

| 観点 | 同一リポジトリー (`web/`) | 別リポジトリー (`parade-web`) |
| --- | --- | --- |
| リリース フローとの連携 | `release.yml` の完了を `workflow_run` で受けて公開できる。追加の認証情報は不要 | 別リポジトリーのワークフローを起動するには `repository_dispatch` と PAT (fine-grained personal access token) の登録が必要。PAT には有効期限があり、更新の運用が増える |
| 機能変更とサイトの同期 | 機能の PR と同じブランチでスクリーンショットや文言を更新できる | アプリと別の PR になり、公開順の調整が必要 |
| アセットの共有 | アプリ アイコン (`build/icon.svg`)、配色トークン (`src/renderer/App.css`)、i18n の文言を直接参照できる | コピーを持ち、ずれないように手で同期する |
| ツールチェーン | mise / pnpm / biome / lefthook をそのまま使う | 一式を再構築する。小さいが二重管理になる |
| CI のノイズ | サイトだけの変更でも `ci.yml` (単体テスト) が走る。パスの条件で軽減できる | 分離される |
| Release Notes | サイトの PR もアプリの Release Notes に載る。`docs` / `chore` ラベルで分類される | 載らない |
| リポジトリーの肥大化 | スクリーンショット (PNG) の履歴が残る。1 枚 500 KB 程度 x 10 枚、差し替えはバージョンごとではなく画面が変わったときだけなので、許容範囲 | 分離される |
| GitHub Pages の URL | `akabekobeko.github.io/parade/` | `akabekobeko.github.io/parade-web/` (リポジトリー名がそのまま出るので、別リポジトリーでも `parade` 以外の名前は URL に不利) |

決め手はリリース フローとの連携です。ダウンロード ページは最新リリースの内容をビルド時に取り込むため、リリースの完了を契機にサイトを再ビルドする必要があります。同一リポジトリーなら `workflow_run` だけで済みます ([デプロイ](deploy.md))。

## ライセンスと利用規約の調査

別リポジトリーの GitHub Pages から、このリポジトリーの GitHub Releases のアセットへリンクして問題がないかを調べました。結論は「問題なし」で、同一リポジトリーの場合も同じです。

- **アセットへの直接リンクは GitHub の公式な使い方である。** GitHub Docs の [Linking to releases](https://docs.github.com/en/repositories/releasing-projects-on-github/linking-to-releases) が、`/releases/latest` と `/releases/latest/download/<asset-name>` を外部から参照する用途として案内している
- **帯域と容量の制限はない。** [About releases](https://docs.github.com/en/repositories/releasing-projects-on-github/about-releases) に「リリースの合計サイズと帯域に制限はない」とある。制限は 1 ファイル 2 GiB と 1 リリース 1,000 ファイルだけ
- **利用規約上の制約は「著しく過剰な帯域」だけ。** [Acceptable Use Policies](https://docs.github.com/en/site-policy/acceptable-use-policies/github-acceptable-use-policies) は、他の利用者と比べて著しく過剰な帯域の使用を制限の対象にしている。個人開発のアプリの配布はこれに当たらない。[Terms of Service](https://docs.github.com/en/site-policy/github-terms/github-terms-of-service) にはリリース アセットの外部リンクに関する条項はない
- **GitHub Pages の制限は商用利用とサイズ。** [GitHub Pages limits](https://docs.github.com/en/pages/getting-started-with-github-pages/github-pages-limits) で、EC サイトや SaaS など商取引が主目的のサイトは禁止、公開サイトは 1 GB 以内、帯域は月 100 GB (ソフト リミット) とされている。アプリの紹介サイトは対象外で、イメージ本体は Releases から配信するので Pages の帯域を消費しない
- **アプリのライセンス (MIT) はどちらでも同じ。** サイトからリンクするだけで再配布にはならず、仮に再配布でも MIT は許諾している。サイトのソースも同じ MIT で公開する

## `web/` の配置

```
web/
├── astro.config.ts
├── package.json            # name: parade-web
├── tsconfig.json
├── public/                 # そのまま配信するファイル (favicon, robots.txt)
├── scripts/                # スクリーンショットのマスク処理など
└── src/
    ├── assets/screenshots/ # 撮影したスクリーンショット (Astro の画像最適化の対象)
    ├── components/
    ├── i18n/               # 辞書 (en.ts / ja.ts)
    ├── layouts/
    ├── lib/                # リリース情報の取得と分類
    ├── pages/
    │   ├── index.astro
    │   ├── download.astro
    │   ├── 404.astro
    │   └── ja/
    └── styles/
```

ルートとの関係は次のとおりです。

- `pnpm-workspace.yaml` に `packages: ["web"]` を追加し、`web/package.json` を workspace のパッケージにする。lockfile はルートの 1 つにまとまり、`pnpm install` 1 回で両方が入る。サイトの操作は `pnpm --filter parade-web <script>` で行う
- `web/` の依存はルートの `package.json` に入れない。Astro は Electron アプリのビルドに無関係で、ルートに混ぜると `electron-builder` の対象判定や `pnpm-workspace.yaml` の `minimumReleaseAge` の管理が煩雑になる
- biome はルートの設定がそのまま `web/` に及ぶ (`files.includes` が `**`)。`.astro` ファイルは biome の対象外なので、Astro 公式の VS Code 拡張または `prettier-plugin-astro` で整形する。lefthook の `glob` に `.astro` は含めない
- `tsconfig.json` の project references には追加しない。`web/tsconfig.json` は Astro の `astro/tsconfigs/strict` を継承した独立の設定とし、`astro check` で検査する
- ルートの `README.md` に `web/` の項目を足し、`docs/README.md` からこの仕様書へリンクする
- `ci.yml` に `astro check` と `astro build` を追加する (`paths` の条件で `web/**` 変更時だけ走らせる)
