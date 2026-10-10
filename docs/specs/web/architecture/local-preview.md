# ローカル プレビュー

公開 (main へのマージ) の前に、サイトをローカルで確認する手順です。GitHub Pages は環境が 1 つしかなく PR ごとのプレビューを作れないため、公開前の確認はローカルで行います。

## 2 つの確認方法

| 方法 | コマンド | URL | 用途 |
| --- | --- | --- | --- |
| 開発サーバー | `pnpm --filter parade-web dev` | `http://localhost:4321/parade/` | 文章やスタイルの編集中。ファイル保存で即時反映 (HMR) |
| ビルドのプレビュー | `pnpm --filter parade-web build` の後に `pnpm --filter parade-web preview` | `http://localhost:4321/parade/` | 公開前の最終確認。GitHub Pages と同じ静的ファイル (`web/dist/`) を配信する |

- Astro は `base` (`/parade`) を開発サーバーでも付けるので、URL は公開時と同じ構成になる。`http://localhost:4321/` は 404 になるが正常
- ポート 4321 は Astro の既定。アプリの開発サーバー (5173) とは衝突しない
- 公開前は必ずビルドのプレビューで確認する。開発サーバーは画像最適化や `trailingSlash` の扱いが本番と異なり、`<Picture>` の出力やリンク末尾の `/` の問題を見落とす
- `pnpm --filter parade-web check` (`astro check`) で型と `.astro` の検査も通す

## リリース情報

ダウンロード ページは起動時 (開発サーバー) またはビルド時に GitHub REST API を呼びます ([リリース情報の取得](release-data.md))。

- 未認証でも動く (60 回 / 時)。開発サーバーの再起動やビルドを繰り返す場合は `GITHUB_TOKEN="$(gh auth token)" pnpm --filter parade-web dev` のように `gh` のトークンを渡す
- オフラインや API 障害のときは、環境変数 `PARADE_WEB_RELEASE_FIXTURE=1` で `web/src/lib/releases/fixtures/releases.json` (v1.3.0 の応答のスナップショット) を使う。vitest も同じ fixture を使う。fixture はリリースのたびに更新しなくてよい (分類のテストと表示の確認が目的)
- 開発サーバーでは取得に失敗してもページを出し、失敗の旨をダウンロード ページに表示する。ビルドは失敗させる

## 確認項目

公開前 (PR を出す前) に、ビルドのプレビューで次を確認します。

- [ ] 英語 (`/parade/`) と日本語 (`/parade/ja/`) の両方で、トップとダウンロードが表示される
- [ ] ヘッダーの言語切り替えで同じページの他言語へ移り、テーマ切り替えでちらつきなく切り替わる。再読み込みで選んだテーマが保たれる
- [ ] ダーク / ライトの両方で文字と glow が読める。OS のテーマを変えても保存がなければ追従する
- [ ] ダウンロード ページのリンクが実在のアセットを指す (`curl -I <url>` で 302 が返る)。バージョンと公開日が GitHub Releases の最新と一致する
- [ ] ブラウザーの DevTools で幅 375px (モバイル) にし、ヘッダーの切り替えが残り、横スクロールが出ない
- [ ] JavaScript を無効にしても内容とダウンロード リンクが読める (DevTools の Disable JavaScript)
- [ ] `http://localhost:4321/parade/nonexistent/` で 404 ページが出る (`preview` は `404.html` を返す)
- [ ] スクリーンショットにファイル パスやユーザー名が写っていない ([スクリーンショット](../features/screenshots.md))
- [ ] Lighthouse (DevTools、モバイル) の Performance / Accessibility / SEO が 90 以上
- [ ] `<head>` の `hreflang`、`canonical`、OGP が locale ごとに正しい (ページのソースを見る)

AI (Claude Code) に確認を任せる場合は、ビルドとプレビューの起動、`curl` によるリンクとステータスの検査、ブラウザー (Chrome) での表示確認とスクリーンショット取得を依頼します。最終的な見た目の判断は人が行います。

## PR でのビルド成果物

ローカル環境を用意せずに PR の内容を確認したいときのために、`ci.yml` の `web` job で `web/dist/` を `actions/upload-artifact` で保存します (保持 7 日)。Actions の画面からダウンロードし、`npx serve web/dist` などで配信して確認できます。`base` が `/parade` なので、配信した URL に `/parade/` を付けて開きます。
