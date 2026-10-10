# スクリーンショット

デモ モードで macOS のスクリーンショットを撮影し、個人情報をマスクしてサイトに載せる手順です。撮影は AI (Claude Code) がローカルでアプリを起動して行う想定ですが、人が同じ手順で撮っても同じ結果になるようにします。

## 前提

- macOS。デモ用データの生成に `sips` と `afconvert` が必要 ([デモ モード](../../../demo/README.md))
- Retina ディスプレイ (2x) で撮影する。ウィンドウ 1280 x 800 を 2560 x 1600 の PNG で保存する
- 表示の拡大率はシステム既定 (「デフォルト」)。メニュー バーとドックの状態は写らないので任意

## 手順

1. `pnpm demo` でアプリを起動する。初回はデモ用データの生成に 30 秒ほどかかる
2. 必要なら `pnpm demo:assets` で初期状態に戻す (前回の撮影で設定や選択を変えている場合)
3. 撮影する画面ごとに [撮影する画面](#撮影する画面) の操作を行う
4. ウィンドウ単位でキャプチャーする
   - ウィンドウ ID (CGWindowID) を取得する: AI が操作する場合は `cmux-cua` の `list_windows`。人が撮る場合は `GetWindowID` (Homebrew) で `GetWindowID Electron --list` のように取得する。開発起動のプロセス名は `Electron`
   - `screencapture -l <windowId> <scene>.png` で保存する。影を含めたまま撮る (`-o` を付けない)。サイトでは枠や影を付けない前提 ([テーマとスタイル](../architecture/theme.md))
   - 保存先は Claude Code の scratchpad など、リポジトリーの外。マスク前の画像は commit しない
5. [マスク](#マスク) を施して `web/src/assets/screenshots/<scene>.png` へ出力する
6. 画像を目視で確認し、ファイル パス、ユーザー名、実在の人物や作品が写っていないことを確かめる

AI が操作する場合は `cmux-cua` の `launch_app` ではなく `pnpm demo` で起動し (dev server と watch ビルドが必要)、起動後のウィンドウを `list_windows` で見つけて AX (Accessibility) 経由で操作します。Electron の AX ツリーはレンダラーの DOM を反映するので、サイドバーのタブや行はラベルで辿れます。AX で辿れない操作 (ドラッグ、hover) は座標指定のクリックとカーソル移動で行います。

## 撮影する画面

テーマはデモ設定の既定 (ダーク) を基本にし、テーマ紹介用に 1 枚だけライトを撮ります。アプリの言語は英語だけです (設定の Language を English にする。OS が日本語の場合は System のままだと日本語になる)。日本語 UI は撮らず、対応言語は `settings` の画面と文章で伝えます。

| scene | 画面 | 操作 | 注意 |
| --- | --- | --- | --- |
| `artists` | Artists ビュー、Milo Ashgrove、再生中 | 起動直後の状態 (Milo Ashgrove が選択済み)。アルバム Modulations の 1 曲目 Test Tone Serenade を再生する。再生位置が 0:30 前後になるまで待つ | 再生できるのはこの曲だけ。他の曲は再生するとエラーになる |
| `artists-light` | 同上、ライト テーマ | Settings → Theme を Light にしてから `artists` と同じ状態にする | 撮影後に Dark へ戻す |
| `albums` | Albums ビュー、フィルター適用 | サイドバーのジャンルで Jazz、年代で 1990s を選び、アルバムが 10 - 20 枚程度並ぶ状態にする。再生中のまま | ジャケットは生成した抽象図形なので権利の問題はない |
| `playlists` | Playlists ビュー、テーブル | My Best を開く。カラム メニューで Album Artist と Genre と Year を表示し、ウィンドウ幅に収まるように調整する。1 行目 (Test Tone Serenade) を再生中にする | 右クリック メニューは閉じる |
| `music-info` | 曲情報ダイアログ | Test Tone Serenade の行メニューから Music info を開き、Basic タブを表示する | **File タブはファイル パスが出るので撮らない。** Basic タブでもファイル名が見える場合はマスクする |
| `player` | プレーヤー バーとキュー | 再生中にキュー ボタンでキュー ポップオーバーを開く。ウィンドウ全体を撮り、サイト側でプレーヤー バー付近を切り出す | 切り出しの座標はマスクの manifest に書く |
| `settings` | Settings ページ | サイドバーから Settings を開く。Theme が Dark、Language が English の状態 | ライブラリー統計はデモ用データの数値なのでそのままでよい |

- 撮影の前に、トースト通知、ツールチップ、ホバー状態が残っていないことを確認する
- ウィンドウの位置は画面の中央にし、他のウィンドウを重ねない
- 撮り直す場合は同じ scene 名で上書きする。画面が変わっていない scene は撮り直さない (差分を小さくするため)

## マスク

スクリーンショットに次が写り得ます。

- 音楽ファイルのパス: `~/Library/Application Support/Parade/demo-N/musics/...`。ユーザー名を含む。曲情報ダイアログの File タブ、取り込みダイアログ、曲情報の適用失敗の表示に出る
- 設定のライブラリー統計 (曲数など): 個人情報ではないが、デモ用データの数値なのでそのままでよい

対応は「写さない」を優先し、どうしても写る場合だけモザイクを掛けます。

- 撮影する画面の選び方で File タブと取り込みダイアログを避ける
- モザイクは `web/scripts/maskScreenshots.ts` で掛ける。`sharp` で対象領域を 1/16 に縮小してから最近傍補間で元のサイズに戻し、元画像に合成する (ぼかしではなくモザイク。ぼかしは復元される可能性がある)
- 領域は `web/screenshots.manifest.json` に scene ごとに記録する (`x`、`y`、`width`、`height`、2x の座標)。切り出し (`player`) も同じ manifest に書く
- 実行は `pnpm --filter parade-web screenshots:mask -- <input-dir>`。入力はマスク前の画像のディレクトリー、出力は `web/src/assets/screenshots/`

```json
{
  "music-info": {
    "mask": [{ "x": 640, "y": 1180, "width": 1280, "height": 48 }]
  },
  "player": {
    "crop": { "x": 0, "y": 1360, "width": 2560, "height": 240 }
  }
}
```

## 確認項目

commit する前に次を確認します。

- [ ] ファイル パス、ユーザー名、メール アドレスが写っていない
- [ ] 実在のアーティスト名、曲名、アルバム名がない (デモ用データは架空だが、偶然の一致は `docs/demo/README.md` の注意のとおり)
- [ ] トースト、ツールチップ、ホバー状態が残っていない
- [ ] 画像サイズが 2560 x 1600 (切り出した `player` を除く) で、ファイル サイズが 1 枚 1 MB 以内
- [ ] `pnpm --filter parade-web build` で画像最適化が通る

## 更新の契機

画面の見た目が変わった PR (新しいビュー、レイアウト変更、配色変更) で撮り直します。バージョン番号だけの変更では撮り直しません。スクリーンショットに写る画面を変える PR では、この手順で撮り直した画像を同じ PR に含めます。
