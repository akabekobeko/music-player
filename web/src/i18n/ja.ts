import type { Dictionary } from "./types";

/** Japanese dictionary. Must define every key of `en.ts` (type-checked). */
export const ja: Dictionary = {
  "site.name": "Parade",
  "site.tagline": "ローカルの音楽ライブラリーのためのミュージック プレーヤー",
  "site.description":
    "Parade は macOS / Windows / Linux で動く、ローカルの音楽ライブラリーのための無料でオープンソースのミュージック プレーヤーです。",
  "nav.home": "ホーム",
  "nav.download": "ダウンロード",
  "header.switchLocale": "英語に切り替え",
  "header.switchLocale.label": "English",
  "header.switchLocale.short": "EN",
  "header.theme": "ダーク テーマ",
  "header.github": "GitHub リポジトリー",
  "home.title": "Parade",
  "home.github": "GitHub で見る",
  "home.download": "ダウンロード",
  "home.download.mac": "macOS 版をダウンロード",
  "home.download.win": "Windows 版をダウンロード",
  "home.download.linux": "Linux 版をダウンロード",
  "home.latest": "最新バージョン {version} ({date} 公開)",
  "home.hero.summary":
    "macOS / Windows / Linux で動作し、UI は英語と日本語に対応。MIT License のオープンソースで、Electron 製です。",
  "home.hero.screenshot.alt":
    "ダーク テーマの Parade の Artists ビュー。Milo Ashgrove のアルバムを表示し、曲を再生している",
  "home.features.title": "主な機能",
  "home.feature.artists.title": "アーティストから探す",
  "home.feature.artists.body":
    "頭文字で並んだ一覧からアーティストを選び、アルバムと曲を眺めながら再生できます。アーティスト画像とアートワークで、ライブラリーをひと目で見分けられます。",
  "home.feature.artists.alt":
    "Milo Ashgrove のアルバムを、アーティスト画像とアートワークとともに表示した Artists ビュー",
  "home.feature.albums.title": "アルバムを絞り込む",
  "home.feature.albums.body":
    "サイドバーでジャンル、年代、文字入力からアルバムを絞り込み、並んだジャケットを眺められます。",
  "home.feature.albums.alt":
    "サイドバーでジャンル Jazz と 1990 年代に絞り込み、ジャケットをグリッド表示した Albums ビュー",
  "home.feature.playlists.title": "プレイリストとスマート プレイリスト",
  "home.feature.playlists.body":
    "手で並べる通常のプレイリストと、条件で自動的に更新されるスマート プレイリストを使えます。曲のテーブルは表示するカラムを選び、幅と並び順を変え、好きなカラムでソートできます。",
  "home.feature.playlists.alt":
    "プレイリスト My Best を、タイトル、アーティスト、アルバム、アルバム アーティスト、ジャンル、年のカラムでテーブル表示した Playlists ビュー",
  "home.feature.metadata.title": "曲情報を編集して補完する",
  "home.feature.metadata.body":
    "曲情報ダイアログでタイトル、アーティスト、アートワークなどを編集し、ファイルへ書き戻せます。複数の曲をまとめて編集することもできます。不足している情報とカバー アートは MusicBrainz と Cover Art Archive から取得し、項目ごとに採用するかどうかを選べます。",
  "home.feature.metadata.alt":
    "Details タブでタイトル、アーティスト、アルバム、ジャンル、年の入力欄を表示した曲情報ダイアログ",
  "home.feature.player.title": "好きなように再生する",
  "home.feature.player.body":
    "再生キューに曲を並べ、シャッフルし、OS のメディア キーから操作できます。対応形式は mp3、flac、m4a / mp4、ogg / opus、wav、aiff、wma、ape です。",
  "home.feature.player.alt":
    "曲を再生中のプレーヤー バーと、次に再生する曲を並べたキューのポップオーバー",
  "home.feature.theme.title": "ライトとダーク",
  "home.feature.theme.body":
    "ダークとライトのテーマを用意しています。OS の設定に追従させることも、好きなほうに固定することもできます。",
  "home.feature.theme.alt":
    "ライト テーマの Parade の Artists ビュー。Milo Ashgrove のアルバムを表示している",
  "home.feature.language.title": "英語と日本語",
  "home.feature.language.body":
    "設定ページで English / 日本語 / System から言語を選べます。テーマも同じ設定ページで切り替えられます。",
  "home.feature.language.alt":
    "Theme を Dark、Language を English に設定した Settings ページ",
  "home.cta.title": "Parade を入手する",
  "home.cta.body":
    "macOS / Windows / Linux 向けに、無料でオープンソースで提供しています。",
  "home.cta.button": "ダウンロード ページへ",
  "download.title": "Parade をダウンロード",
  "download.pageTitle": "Download | Parade",
  "download.description":
    "macOS / Windows / Linux 向けの Parade をダウンロードできます。無料でオープンソースです。",
  "download.released": "{date} 公開",
  "download.releaseNotes": "Release Notes",
  "download.fetchFailed":
    "最新リリースを取得できませんでした (開発サーバーのみ): {message}",
  "download.card.mac": "macOS",
  "download.card.mac-arm64.note": "Apple Silicon (M1 以降)",
  "download.card.mac-x64.note": "Intel",
  "download.card.win": "Windows",
  "download.card.win-x64.note": "64-bit",
  "download.card.linux": "Linux",
  "download.card.linux-x64.note": "x86_64",
  "download.card.detected": "お使いの OS",
  "download.button.dmg": ".dmg をダウンロード",
  "download.button.exe": "インストーラー (.exe) をダウンロード",
  "download.button.AppImage": "AppImage をダウンロード",
  "download.link.zip": ".zip",
  "download.link.zip.win": "ポータブル版 (.zip)",
  "download.link.deb": ".deb (Debian / Ubuntu)",
  "download.card.missing": "GitHub Releases で確認",
  "download.macHelp":
    "どちらかわからない場合は、Apple メニューの「この Mac について」で「チップ」の表記を確認してください。Apple Silicon の Mac でも Intel 版は Rosetta で動きますが、速度は落ちます。",
  "download.notes.title": "起動する前に",
  "download.notes.intro":
    "バイナリーはコード署名していません。Apple Developer Program とコードサイニング証明書が有償で、Parade を無償で運用しているためです。そのため各 OS で初回起動時に警告が出ます。",
  "download.notes.mac.title": "macOS",
  "download.notes.mac.body":
    "Gatekeeper にブロックされます。初回は Parade.app を右クリックして「開く」を選んでください。macOS 15 以降では「システム設定」→「プライバシーとセキュリティ」の「このまま開く」が必要な場合があります。それでも開けないときはターミナルで次を実行してください。",
  "download.notes.windows.title": "Windows",
  "download.notes.windows.body":
    "SmartScreen の警告が出ます。「詳細情報」→「実行」で起動してください。",
  "download.notes.linux.title": "Linux",
  "download.notes.linux.body":
    "AppImage は実行権限を付けてから起動します。.deb パッケージは apt でインストールします。",
  "download.more.title": "その他",
  "download.more.allReleases": "GitHub のすべてのリリース",
  "download.more.allReleases.body":
    "過去のバージョンと Release Notes の全文は GitHub Releases にあります。",
  "download.more.requirements": "動作環境",
  "download.more.requirements.before":
    "同梱の Chromium (Electron) が動く環境で動作します。起動しない場合は ",
  "download.more.requirements.link": "GitHub Issues",
  "download.more.requirements.after": " でお知らせください。",
  "download.more.formats": "対応音声形式",
  "download.more.formats.body":
    "mp3, flac, m4a / mp4, ogg / opus, wav, aiff, wma, ape",
  "notFound.title": "ページが見つかりません",
  "notFound.pageTitle": "Page not found | Parade",
  "notFound.message": "お探しのページは存在しません。",
  "footer.copyright": "© 2026 akabeko",
  "footer.license": "MIT License",
  "footer.github": "GitHub",
  "footer.releases": "Releases",
  "footer.issues": "Issues",
  "footer.credits.before": "音楽のメタデータとカバー アートは ",
  "footer.credits.musicbrainz": "MusicBrainz",
  "footer.credits.and": " と ",
  "footer.credits.coverArtArchive": "Cover Art Archive",
  "footer.credits.after": " から提供されています。",
};
