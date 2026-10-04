# デモ モード

アプリを紹介するスクリーンショットを撮影するための、架空のライブラリーで起動するモードです。実在するアーティストや曲を画面に出さないことを目的としています。

## 起動方法

```sh
pnpm demo
```

`pnpm dev` と同じ開発用の起動 (Renderer の dev server と Main / Preload の watch ビルド) を、デモ用データに差し替えて行います。デモ用データはリポジトリーに含めず、データ ディレクトリー直下のバージョン番号つきディレクトリー `demo-N` (例: `demo-1`) へ生成します。`N` は `scripts/demo/assets/generateDemoAssets.ts` の定数 `DEMO_ASSETS_VERSION` です。

起動のたびに次の処理をします。

1. データ ディレクトリー直下にある、現在のバージョン以外のデモ用ディレクトリーを削除します (ほかの番号の `demo-N` と、バージョン管理を導入する前の `demo`)
2. 現在のバージョンの `demo-N` が生成済みであれば、そのまま利用します
3. `demo-N` がない、または生成が完了していない場合は、デモ用データを `demo-N` へ生成します ([データの更新](#データの更新) の `pnpm demo:assets` と同じ処理)
4. `demo-N` を `userData` として Electron を起動します

`demo-N` ディレクトリーの場所は次のとおりです。

- macOS: `~/Library/Application Support/Parade/demo-N`
- Windows: `%APPDATA%\Parade\demo-N`
- Linux: `~/.config/Parade/demo-N`

デモ起動中のライブラリー DB、設定、アートワーク、Chromium のキャッシュはすべて `demo-N` 配下に置かれるので、通常のデータを参照も変更もしません。生成済みの `demo-N` はそのまま使うので、デモ中に行った取り込みや削除、設定変更は次回の `pnpm demo` にも残ります。初期状態へ戻すには `pnpm demo:assets` を実行するか、`demo-N` を削除してから `pnpm demo` を実行します。

生成にはネットワーク (Wikimedia Commons) と macOS (`sips`、`afconvert`) が必要で、30 秒ほどかかります。そのため Windows と Linux では、生成済みの `demo-N` がなければ `pnpm demo` は失敗します。生成が途中で失敗した場合は、次回の `pnpm demo` で続きから生成します。

`pnpm dev` と同じポート (5173) で dev server を起動するので、`pnpm dev` やほかの `pnpm demo` と同時には実行できません。ポートが使用中の場合は、デモ用ディレクトリーに触れる前にエラーで終了します (起動中のデモのデータを消さないため)。

### 仕組み

- `scripts/demo.ts` がデータを準備し、環境変数 `PARADE_USER_DATA_DIR` に `demo-N` ディレクトリーのパスを設定して `scripts/dev.ts` を実行します
- Main プロセス (`src/main/main.ts`) は未パッケージ実行のときだけ `PARADE_USER_DATA_DIR` を読み、指定があればそのディレクトリーを `userData` にします。パッケージ版のアプリはこの環境変数を読まないので、デモ モードはありません
- 生成が完了した `demo-N` には目印のファイル `.demo-ready` を置きます。このファイルがないディレクトリーは生成途中とみなして、生成をやり直します
- `app.db` の `musics.file_path` と `pictures.file_path` には、`demo-N` 配下を指す絶対パスを OS のパス区切りで保存します
- `app.db` のスキーマがアプリより古い場合は、通常の起動と同じくアプリがマイグレーションします

### バージョン番号の更新

生成物に影響する変更をしたら、同じ変更のなかで `DEMO_ASSETS_VERSION` を 1 増やします。番号が変わると、次回の `pnpm demo` が古い `demo-N` を削除して生成し直します。更新が必要になる変更は [コーディングルール](../coding-rules/README.md#生成物に影響する変更では-demo_assets_version-を増やす) にまとめています。

## 再生できる曲

DB には全曲のタイトルやファイル パスが入っていますが、音声ファイルの実体があるのは次の 1 曲だけです。プレーヤーの再生状態を撮影するときはこの曲を使ってください。

| 項目 | 値 |
| --- | --- |
| アーティスト | Milo Ashgrove |
| アルバム | Modulations (2018) |
| 曲名 | Test Tone Serenade (トラック 1) |
| 演奏時間 | 1:47 |
| ジャンル | Electronic |
| 形式 | m4a (AAC) |
| ファイル | `demo-N/musics/Milo Ashgrove/Modulations/01 Test Tone Serenade.m4a` |

次の場所から再生できます。

- Artists: 頭文字 M の Milo Ashgrove (起動直後に選択されています) → アルバム Modulations の 1 曲目
- Albums: Modulations
- Playlists: My Best の 1 曲目
- Playlists: スマートプレイリスト Electronic の 1 行目 (追加日の新しい順に並び、この曲のアルバムが最新です)

ほかの曲はファイルがないため再生するとエラーになります。

音声は音楽ではなく、スクリプトで合成した信号音 (ペンタトニック スケール上のサイン波と持続音) です。

## デモ用データ

### ディレクトリー構成

リポジトリーに置くのは資料と設定だけです。

```
docs/demo/
├── README.md        # この資料
├── CREDITS.md       # アーティスト画像のクレジット (生成時に更新)
└── settings.json    # デモ用の設定 (生成時に demo-N へコピー)
```

画像、音声、DB は生成時にデータ ディレクトリーへ作成します。

```
<データ ディレクトリー>/demo-N/
├── .demo-ready      # 生成が完了した目印
├── app.db           # ライブラリー DB (ファイル パスは絶対パス)
├── settings.json    # docs/demo/settings.json のコピー
├── images/
│   ├── albums/      # アルバムのカバー画像 (<artist>--<album>-<hash>.jpg)
│   └── artists/     # アーティスト画像 (<artist>.jpg)
└── musics/          # 再生できる 1 曲だけを格納
```

### ライブラリーの内容

| 項目 | 内容 |
| --- | --- |
| アーティスト | 82 組 |
| アルバム | 346 枚 (アーティストごとに 1 - 15 枚) |
| 曲 | 3,801 曲 |
| ジャンル | Rock / Pop / Jazz / Electronic / Classical / Folk / Hip Hop / Blues / Ambient / Soundtrack |
| 年代 | 1960 年代 - 2020 年代、年不明のアルバムが 2 枚 |

- アーティスト名はすべて架空のもので、人名、バンド名、ダミーとして使われがちな名前 (John Doe、Lorem Ipsum、Alice & Bob など) を混ぜています。実在のアーティストと偶然一致する可能性はあります
- 頭文字は A - Z をすべて埋めています。A、B、M、S は 6 組、Q、U、V、X、Y、Z は 1 組というように数をばらつかせています
- 冠詞を無視した並びを示すため、The で始まる名前が 16 組あります (The Amber Arcade は A、The Blue Lanterns は B に入ります)
- 大文字だけの名前 (ALMANAC、FJORD など) が 11 組、小文字だけの名前 (aurora club、opal など) が 9 組あります
- 数字や日本語で始まる 3 組 (7 Days of Rain、808 Motel、山田太郎) は「その他」に入ります
- アルバムが 15 枚あるのは The Blue Lanterns と Sebastian Crowe です。Artists の「アルバムへ移動」のデモに使えます
- 年不明のアルバムは ALMANAC の Kingdom と Lorem Ipsum の The Wild Anchor で、Albums の年代フィルターの Unknown に入ります
- 2 枚組のアルバム (Disc 1 / Disc 2) と、ゲスト参加曲 (曲のアーティストが `A feat. B`、アルバム アーティストが `A`) を一部に含みます
- 作曲者、作詞者、プロデューサー、指揮者 (Classical と Soundtrack のみ)、パブリッシャーも架空の名前で埋めています

### プレイリスト

| 名前 | 種類 | 内容 |
| --- | --- | --- |
| My Best | 通常 | 20 曲。1 曲目が再生できる曲 |
| Electronic | スマート | ジャンルが Electronic の曲を追加日の新しい順に表示。1 行目が再生できる曲 |
| Jazz | スマート | ジャンルが Jazz の曲 |
| Rock | スマート | ジャンルが Rock の曲 |

### 設定

`docs/demo/settings.json` はウィンドウ サイズを 1280 x 800、テーマを dark、サイドバーを表示、起動時の画面を Artists (Milo Ashgrove を選択) にしています。ウィンドウ位置と言語は指定していないので OS に従います。撮影に合わせてテーマや言語を変えたい場合は、起動後にアプリの設定から変更してください。変更は `demo-N` の `settings.json` に保存され、生成し直すまで残ります。

## 画像と音声の出どころ

第三者の素材は、出典とライセンスを確認できるものだけを使っています。

### アルバムのカバー画像

`scripts/demo/assets/renderAlbumCoverSvg` が生成した抽象的な図形とタイトル文字の画像です。第三者の素材は使っていません。SVG を macOS の `sips` で JPEG (512 x 512) にしており、文字は macOS のシステム フォントで描画しています。

### アーティスト画像

[Wikimedia Commons](https://commons.wikimedia.org/) で [CC0 1.0](https://creativecommons.org/publicdomain/zero/1.0/) (パブリック ドメイン提供) として公開されている画像を、正方形 (512 x 512) に切り抜いて使っています。大半は写真で、一部は美術館が CC0 で公開している所蔵品 (古い楽器や図案など) の画像です。利用したサービスは Wikimedia Commons だけです。

- 画像ごとの出典、作者、ライセンスは [CREDITS.md](CREDITS.md) にまとめています
- ライセンスは取得時に Commons の API (`imageinfo` の `extmetadata.License`) で確認し、`cc0` 以外のファイルがあれば取得を中止します
- CC0 が放棄するのは撮影者や公開者の著作権だけなので、肖像権や商標、写り込んだ物の権利に配慮して選んでいます。人物が特定できる写真、ロゴやブランド名が読み取れる写真、現代の著作物 (ポスター、ジャケット、グラフィティ、彫刻など) が主題の写真は避け、楽器、風景、動植物、道具などを題材にしています
- 選定は目視で行っています。問題のある画像が見つかった場合は `seed/demoArtistPhotos.ts` のファイル名を差し替えて `pnpm demo:assets` を実行し、`DEMO_ASSETS_VERSION` を増やしてください

### 音声

`scripts/demo/assets/synthesizeDemoToneWav.ts` が合成した信号音を macOS の `afconvert` で AAC にしたものです。第三者の素材は使っていません。

## データの更新

デモ用データは `scripts/demo/assets/seed` の定義と `docs/demo/settings.json` から生成します。`demo-N` のファイルを直接編集せず、定義を変更してから再生成してください。

| ファイル | 内容 |
| --- | --- |
| `seed/demoArtists.ts` | アーティスト (名前、ジャンル、活動開始年、アルバム数) と再生できる曲 |
| `seed/demoArtistPhotos.ts` | アーティスト画像に使う Wikimedia Commons のファイル |
| `seed/vocabulary.ts` | アルバム名や曲名を組み立てる語彙、ジャンルごとの値の範囲 |

```sh
# 現在のバージョンの demo-N へ、アーティスト画像、カバー画像、再生できる曲、app.db、settings.json を生成
pnpm demo:assets
```

- `pnpm demo` は `demo-N` が生成済みなら何もしないので、定義の変更を確認するときは `pnpm demo:assets` で生成し直します。`pnpm demo` の起動中には実行しないでください (起動中のアプリが使っている DB を置き換えてしまうため)
- 変更を確認できたら `DEMO_ASSETS_VERSION` を増やしてコミットします ([バージョン番号の更新](#バージョン番号の更新))
- macOS 専用で (`sips` と `afconvert` を使います)、ネットワークが必要です
- 生成は決定的です。アルバム名や曲名はアーティスト名を種にした擬似乱数で決まるので、あるアーティストの定義を変えてもほかのアーティストの内容は変わりません。例外はゲスト参加曲の相手で、ほかのアーティストから選ぶため、アーティストの追加、削除、改名で変わることがあります
- `app.db` と `settings.json` は毎回作り直します。デモ中に行った操作や設定変更は残りません
- 既存のカバー画像と音声ファイルは作り直しません。作り直す場合は `--force` を付けます (`pnpm demo:assets --force`)。カバー画像のファイル名にはアーティスト名とアルバム名から求めたハッシュが入るので、改名したアルバムのカバーは新しい名前で生成されます。どのアルバムにも使われなくなった画像は削除します
- アーティスト画像は、`CREDITS.md` に記録された出典が定義と同じであれば取得し直しません。`seed/demoArtistPhotos.ts` で `title` を差し替えた画像だけを取得します。`align` だけを変えた場合や、すべて取得し直す場合は `--force` を付けます
- アーティスト画像に指定できるのは JPEG のファイルだけです
- アーティストを追加したら、`seed/demoArtistPhotos.ts` に CC0 の写真を追加してから `pnpm demo:assets` を実行します
- 生成のたびに `docs/demo/CREDITS.md` を Commons の最新の情報で書き出します。`pnpm demo` による生成でも同じです。差分が出た場合は内容を確認してコミットしてください
- `scripts/demo/assets/demoCredits.test.ts` が `CREDITS.md` と定義の整合を、`demoSettings.test.ts` が `settings.json` の妥当性を検証します。写真の定義を変えて再生成を忘れるとテストが失敗します
