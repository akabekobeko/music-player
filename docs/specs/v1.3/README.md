# v1.3

Parade v1.3 の仕様書です。Playlists ビューのコンテンツ領域にある曲リストを、カラムを持つテーブルへ置き換えます。

## テーマ

**Playlists の曲リストをテーブルにし、カラムの幅と表示の切り替え、カラムごとのソートをユーザーが操作できるようにする。**

- 曲リストを `<table>` にし、ヘッダー行 (`<thead>`) をスクロールしても上端へ固定する
- カラム幅をヘッダーの境界のドラッグでリサイズできる
- カラムのヘッダーをクリックして昇順・降順のソートを切り替えられる
- コンテンツ ツールバーのメニュー ボタンから、表示するカラムを切り替えられる
- 行の Virtualization (@tanstack/react-virtual) は維持する

先行例は [@akabeko/music-metadata-editor の GUI](https://github.com/akabekobeko/npm-music-metadata-editor/tree/main/packages/gui) のスプレッドシートです。テーブルの構造、リサイズ、カラム メニューの設計を参考にします。

## 仕様書の構成

v1.2 と同じく、エントリーポイントを README、機能仕様を `features/` に置きます。1 ファイルの分量は日本語換算 1,000 文字を目安とし、超える場合は項目ごとに分割して分割元からリンクします。

### 計画

- [スコープ](scope.md)
  - v1.3 でやること・やらないこと
- [ロードマップ](roadmap.md)
  - 実装フェーズの分割と順序

### アーキテクチャー

- [テーブル ライブラリー選定](architecture/table-library.md)
  - 独自実装の採用と要件。[候補の比較](architecture/table-library-candidates.md)
- [テーブルの構造](architecture/table-structure.md)
  - 要素の構成、ヘッダーの固定、Virtualization、横スクロール
- [カラム設定の永続化](architecture/column-settings.md)
  - `AppSettings` への保存項目、sanitize、store。[型定義](architecture/column-settings-types.md)

### 機能仕様

- [Playlists のテーブル](features/playlist-table.md)
  - 行の操作 (選択・再生・メニュー・並べ替え) と v1.2 からの変更点
- [カラム定義](features/columns.md)
  - カラムの一覧、既定の表示と幅、セルの表示形式
- [カラム幅のリサイズ](features/column-resize.md)
  - ドラッグ操作、最小幅、タイトル カラムの扱い
- [ソート](features/column-sort.md)
  - クリックでの切り替え、比較規則、並べ替え・再生との関係
- [表示カラムの切り替え](features/column-visibility.md)
  - メニュー ボタンの位置、メニューの内容、常に表示するカラム
- [カラムの並べ替え](features/column-reorder.md)
  - ヘッダーのドラッグ & ドロップ、動かせるカラム、並び順の持ち方

## リリース

v1.3 はマイナーリリースです。機能 PR には `release:minor` ラベルを付与します ([リリース フロー](../../release.md))。
