# ダウンロード ページ

GitHub Releases の最新リリースを、プラットフォームごとにわかりやすく提示します。

## 解決する課題

- GitHub Releases は開発者向けの画面で、アプリを使いたいだけの人には Release Notes とアセットの一覧が混在して読みにくい
- アセット名 (`Parade-1.3.0-mac-arm64.dmg`) から「自分の Mac はどれか」を判断するには arm64 / x64、dmg / zip の知識が要る

## 構成

### 1. 見出しとバージョン

- `h1`: Download Parade
- 最新バージョン (`v1.3.0`)、公開日、Release Notes へのリンク (`html_url`)
- 値は[リリース情報の取得](../architecture/release-data.md)の結果から埋め込む

### 2. プラットフォーム別カード

4 枚のカードを並べます (デスクトップ 2 x 2、モバイル 1 列)。

| カード | 見出し | 補足 | 主ボタン | 副リンク |
| --- | --- | --- | --- | --- |
| macOS (Apple Silicon) | macOS | Apple Silicon (M1 以降) | Download .dmg | .zip |
| macOS (Intel) | macOS | Intel | Download .dmg | .zip |
| Windows | Windows | 64-bit | Download installer (.exe) | Portable (.zip) |
| Linux | Linux | x86_64 | Download AppImage | .deb (Debian / Ubuntu) |

- 主ボタンは塗りつぶし (`--primary`、hover で primary glow)、副リンクはテキスト リンク
- ボタンの下にファイル名とサイズ (`Parade-1.3.0-mac-arm64.dmg, 129.3 MB`) を小さく出す。Releases の一覧と突き合わせられるようにする
- macOS の 2 枚には「どちらかわからない場合」の案内を置く: Apple メニュー →「この Mac について」でチップの表記を確認する。Apple Silicon の Mac で Intel 版を使うと Rosetta で動くが遅い
- 訪問者の OS を判定できる場合 (`navigator.userAgentData.platform` または `navigator.platform`)、該当するカードを先頭に移し、枠を強調する。macOS では Apple Silicon か Intel かをブラウザーから確実に判定できないため、macOS の 2 枚をどちらも先頭側に置く。JavaScript なしでは上表の順のまま
- 主の形式がリリースにない場合、そのカードは「GitHub Releases で確認」のリンクだけにする

### 3. インストール時の注意

`docs/release.md` の「バイナリーは未署名」の案内を利用者向けに書き直します。

- **macOS**: 署名も notarize もしていないため Gatekeeper にブロックされる。初回はアプリを右クリックして「開く」を選ぶ。それでも開けない場合はターミナルで `xattr -d com.apple.quarantine /Applications/Parade.app` を実行する。macOS 15 以降は「システム設定」→「プライバシーとセキュリティ」の「このまま開く」が必要な場合がある
- **Windows**: SmartScreen の警告が出る。「詳細情報」→「実行」で起動する
- **Linux**: AppImage は `chmod +x` してから実行する。`.deb` は `sudo apt install ./Parade-<version>-linux-amd64.deb`
- 署名していない理由 (Apple Developer Program とコードサイニング証明書が有償で、無償運用のため) を一文で添える

### 4. その他

- 全バージョンの一覧 (`https://github.com/akabekobeko/parade/releases`) へのリンク。過去バージョンはここから辿ってもらう
- 対応 OS の最低バージョンは、Electron の同梱 Chromium の対応範囲に従う旨と、問題があれば Issues へ、の案内
- 対応音声形式の一覧 (トップ ページと同じ文言)

## 表示の例

```
Download Parade
v1.3.0  Released October 4, 2026  Release notes

+-------------------------------+  +-------------------------------+
| macOS                          |  | macOS                          |
| Apple Silicon (M1 or later)    |  | Intel                          |
| [ Download .dmg ]  .zip        |  | [ Download .dmg ]  .zip        |
| Parade-1.3.0-mac-arm64.dmg     |  | Parade-1.3.0-mac-x64.dmg       |
| 129.3 MB                       |  | 133.2 MB                       |
+-------------------------------+  +-------------------------------+
+-------------------------------+  +-------------------------------+
| Windows                        |  | Linux                          |
| 64-bit                         |  | x86_64                         |
| [ Download installer ] Portable|  | [ Download AppImage ]  .deb    |
| Parade-1.3.0-win-x64.exe       |  | Parade-1.3.0-linux-x86_64.AppImage |
| 111.9 MB                       |  | 126.0 MB                       |
+-------------------------------+  +-------------------------------+

Before you run it
  macOS ... / Windows ... / Linux ...

All releases on GitHub
```

## 更新の流れ

リリースを Publish すると、Release ワークフローの完了後に Pages ワークフローがサイトを再ビルドし、このページが新バージョンに切り替わります ([デプロイ](../architecture/deploy.md))。人手の作業はありません。
