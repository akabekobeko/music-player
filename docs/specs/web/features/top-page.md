# トップ ページ

アプリの概要、主な機能、代表的な画面を 1 ページで見せます。

## 構成

上から順に次のセクションを置きます。

### 1. ヒーロー

- アプリ アイコン (大)、製品名、タグライン `A music player for local audio libraries` (`package.json` の `description` と同じ。日本語は「ローカルの音楽ライブラリーのためのミュージック プレーヤー」)
- 一文の補足: macOS / Windows / Linux で動く、英語と日本語の UI、オープン ソース (MIT)、Electron 製
- 主ボタン「Download」(ダウンロード ページへ)。`navigator.platform` / `userAgentData.platform` が判定できる場合はラベルを「Download for macOS」のように変える (JavaScript なしでは「Download」のまま)
- 副ボタン「View on GitHub」(outline、border glow)
- 直下にメインのスクリーンショット (Artists ビュー、再生中、ダーク)。Retina 2x の画像を `<Picture>` で配信する

### 2. 主な機能

機能ごとに「見出し、2 - 3 文の説明、スクリーンショット」を横並び (デスクトップ) / 縦並び (モバイル) で交互に配置します。項目は現在のバージョン (v1.3) の機能から選びます。

| 機能 | 説明の要点 | スクリーンショット |
| --- | --- | --- |
| Browse by artist | 頭文字のグリッドからアーティストを選び、アルバムと曲を眺めながら再生する。アーティスト画像とアートワークを活かした一覧 | `artists` |
| Filter your albums | ジャンル、年代、テキストでアルバムを絞り込むサイドバー。ジャケットを並べて眺められる | `albums` |
| Playlists and smart playlists | 手で並べる通常のプレイリストと、条件で自動更新されるスマート プレイリスト。カラムの表示、幅、並び順、ソートを変えられるテーブル (v1.3) | `playlists` |
| Edit and complete metadata | 曲情報ダイアログでタイトル、アーティスト、アートワークなどを編集し、ファイルへ書き戻す (v1.1)。複数の曲をまとめて編集できる。MusicBrainz から不足している情報とアートワークを取得して補完する (v1.2) | `music-info` |
| Play your way | 再生キュー、シャッフル、OS のメディア キー対応 (MediaSession)。対応形式: mp3, flac, m4a/mp4, ogg/opus, wav, aiff, wma, ape | `player` (プレーヤー バーとキュー ポップオーバー) |
| Light and dark | OS に追従するダーク / ライト テーマ | `artists-light` |
| English and Japanese | 設定ページで言語を English / 日本語 / System から選べる。テーマも同じ設定ページで切り替える。スクリーンショットは英語 UI だけなので、日本語対応はここで明記する | `settings` |

- MusicBrainz 取得の画面はスクリーンショットを撮らず、文章だけで説明する。デモ用データのアーティストは架空のため MusicBrainz に一致せず、結果の画面を再現できない ([スクリーンショット](screenshots.md))。説明文で MusicBrainz と Cover Art Archive の名前を出し、フッターのクレジットと対応させる ([ページ構成](pages.md))
- 対応プラットフォームの一覧と対応形式は、ヒーローとこのセクションに分けて置く
- 将来の機能 (再生位置マーキング、回転寿司プレイリスト) はトップ ページに載せない。未実装の機能を紹介すると実物との差で信頼を損なう

### 3. ダウンロードへの誘導

- 最新バージョンと公開日 ([リリース情報の取得](../architecture/release-data.md) の結果) を 1 行で示し、ダウンロード ページへのボタンを置く
- 「未署名のため初回起動に手順が要る」旨は、ここでは触れずダウンロード ページで案内する

## 文章

- 英語を正とし、辞書 (`en.ts`) に置く。日本語は `ja.ts` ([多言語対応](../architecture/i18n.md))
- 機能の説明は仕様書 (`docs/specs/v1.x`) の「テーマ」の文を元に、利用者の視点で書き直す。実装の用語 (IPC、SQLite、Virtualization) は出さない
- 見出しは動詞から始める (Browse / Filter / Edit / Play) ことで統一する

## 画像

- スクリーンショットは `web/src/assets/screenshots/` から `<Picture>` で読み込み、`widths` を `[640, 1280, 2560]`、形式を `avif` と `webp` にする
- ヒーロー以外は `loading="lazy"`
- `alt` は辞書から与え、画面の内容 (「Artists view showing albums of Milo Ashgrove」) を書く
