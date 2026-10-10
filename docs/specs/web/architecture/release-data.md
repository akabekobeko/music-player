# リリース情報の取得

ダウンロード ページに載せる最新リリースの情報を、ビルド時に GitHub REST API から取得して静的 HTML に埋め込みます。

## 方式の比較

| 方式 | 評価 |
| --- | --- |
| **ビルド時に API から取得 (採用)** | 閲覧時に API を呼ばず、JavaScript なしで読める。公開の契機をリリース完了に連動させる必要がある ([デプロイ](deploy.md)) |
| 閲覧時にブラウザーから API を取得 | `api.github.com` は CORS を許可しているので技術的には可能。ただし未認証の制限が IP あたり 60 回 / 時で、企業や学校のネットワークでは他の利用者と共有される。JavaScript が必須になり、取得中の表示も要る |
| `/releases/latest/download/<asset>` への固定リンク | アセット名にバージョンが含まれる (`Parade-1.3.0-mac-arm64.dmg`) ため、バージョンを知らずにリンクを組めない。`artifactName` からバージョンを外せば可能だが、Releases の一覧でファイルを見分けにくくなる |
| リリース時にサイト側の JSON を commit する | `release.yml` が `web/` のファイルを書き換えて push することになり、ワークフローの責務が混ざる |

## 取得

Astro のフロントマター (ビルド時) で次を行います。実装は `web/src/lib/releases/` に置き、取得 (`fetchReleases`)、分類 (`classifyAssets`)、選択 (`selectLatestRelease`) を純関数に分けて vitest で検査します。ページからは `getLatestRelease` (ビルドごとに 1 回だけ取得する入口) を呼びます。

1. `GET https://api.github.com/repos/akabekobeko/parade/releases?per_page=10` を呼ぶ。環境変数 `GITHUB_TOKEN` があれば `Authorization: Bearer` を付ける (Actions では自動で与える)
2. 応答を zod スキーマで parse する (アプリの外部 API と同じ方針。読む項目だけ宣言する: `tag_name`、`name`、`html_url`、`published_at`、`draft`、`prerelease`、`assets[].name`、`assets[].browser_download_url`、`assets[].size`)
3. `draft` と `prerelease` を除き、公開日の新しい順に見て、**分類できるアセットを 1 つ以上持つ最初のリリース**を採用する

`/releases/latest` ではなく一覧から選ぶのは、Release ワークフローがリリースの Publish 後にアセットを添付するためです。Publish からアセット添付までの間にサイトをビルドすると、`latest` はアセットのないリリースを返します。この間に `push` 契機でビルドが走っても、直前のリリースを表示し続けるようにします。

## アセットの分類

`electron-builder.yml` の `artifactName` (`${productName}-${version}-${os}-${arch}.${ext}`) に基づいて、ファイル名を次の正規表現で分解します。

```
^Parade-(?<version>\d+\.\d+\.\d+)-(?<os>mac|win|linux)-(?<arch>arm64|x64|amd64|x86_64)\.(?<ext>dmg|zip|exe|AppImage|deb)$
```

Linux の arch は electron-builder が形式ごとに違う名前を出します (v1.3.0 の実アセットは `linux-amd64.deb` と `linux-x86_64.AppImage`)。`docs/release.md` の表 (`x64`) とは一致しないので、分類はこの正規表現を正とします。

| プラットフォーム | 条件 | 主 (推奨) | 副 |
| --- | --- | --- | --- |
| macOS (Apple Silicon) | `mac` / `arm64` | `dmg` | `zip` |
| macOS (Intel) | `mac` / `x64` | `dmg` | `zip` |
| Windows | `win` / `x64` | `exe` (インストーラー) | `zip` (インストール不要) |
| Linux | `linux` / `x86_64` または `amd64` | `AppImage` | `deb` (Debian / Ubuntu) |

- 正規表現に一致しないアセットはダウンロード ページに載せず、ビルド ログに警告を出す (将来 `SHA256SUMS` などを添付したときに気づけるようにする)
- 主の形式が欠けている場合はそのプラットフォームを「GitHub Releases を参照」の表示にする。ページ全体は失敗させない
- 表示用のサイズは `size` から MB (10 進) で算出し、小数 1 桁にする

分類の型は次のとおりです。

```ts
type Platform = "mac-arm64" | "mac-x64" | "win-x64" | "linux-x64";

type DownloadAsset = {
  /** File name on the release, shown as the secondary label. */
  readonly name: string;
  /** `browser_download_url` of the asset. */
  readonly url: string;
  /** Size in bytes. */
  readonly size: number;
  /** Extension without the dot, used to pick the label and the icon. */
  readonly ext: "dmg" | "zip" | "exe" | "AppImage" | "deb";
};

type LatestRelease = {
  /** Tag such as `v1.3.0`. */
  readonly tag: string;
  /** Version without the `v`. */
  readonly version: string;
  /** Release page on GitHub. */
  readonly url: string;
  /** `published_at` of the release. */
  readonly publishedAt: Date;
  /** Assets per platform, primary first. */
  readonly downloads: Readonly<Record<Platform, readonly DownloadAsset[]>>;
};
```

## 失敗時の扱い

- API が 4xx / 5xx を返す、またはネットワークに失敗した場合は、2 秒間隔で最大 3 回再試行し、それでも失敗したら**ビルドを失敗させる**。古い情報で上書き公開するよりも、直前の公開を残すほうがよい。再公開は `workflow_dispatch` で行う
- 分類できるアセットを持つリリースが 1 つもない場合もビルドを失敗させる (初回公開前の状態は想定しない。v1.3.0 が既にある)
- 開発サーバーでは失敗しても落とさず、ダウンロード ページに取得失敗の旨を表示する (トップ ページの作業を妨げないため)
- オフラインでの確認とテストのために、応答のスナップショット (`web/src/lib/releases/fixtures/releases.json`) を `PARADE_WEB_RELEASE_FIXTURE=1` で使える ([ローカル プレビュー](local-preview.md))

## キャッシュ

Astro のビルドごとに 1 回だけ取得します。`web/src/lib/releases/latestRelease.ts` のモジュール スコープで Promise を保持し、トップ ページ (バージョン表示) とダウンロード ページ、英語 / 日本語の各ページから同じ結果を使います。
