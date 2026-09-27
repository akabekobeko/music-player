# ロードマップ

v1.3 の実装フェーズ分割です。v1.2 と同じく「動くものが確認できる」単位で区切り、順に積み上げます。詳細タスクは実装時に issue 化します。

```
Phase 1  テーブル化       カラム定義 / table 構造 / ヘッダー固定 / Virtualization / 行操作の移植
Phase 2  カラムの操作     リサイズ / ソート / 表示の切り替えメニュー
Phase 3  永続化           AppSettings への保存と復元 / sanitize
Phase 4  仕上げ           i18n / 横スクロール時の見た目 / 実データでの QA
```

## Phase 1: テーブル化

**ゴール: 既定のカラムを既定の幅で表示するテーブルで、v1.2 と同じ行操作ができる。広いウィンドウでも右側に空白ができない。**

- カラム定義 (`PLAYLIST_COLUMNS`) とセルの表示 ([カラム定義](features/columns.md))
- `<table>` / `<thead>` / `<tbody>` の構成、ヘッダーの固定、行の Virtualization ([テーブルの構造](architecture/table-structure.md))
- コンテナーの幅の取得 (`ResizeObserver`) と、タイトル カラムによる不足分の引き受け (`fitTitleWidth`。[カラム幅のリサイズ](features/column-resize.md))
- 選択・再生・メニュー・Drag & Drop での並べ替えを行コンポーネントへ移植 ([Playlists のテーブル](features/playlist-table.md))
- 再生中の行の glow、連続選択の角丸の結合など、`MusicRow` の見た目の維持

## Phase 2: カラムの操作

**ゴール: リサイズ・ソート・表示の切り替えが、アプリを開いている間は動く。**

- リサイズ ハンドルとドラッグ中の幅の反映 ([カラム幅のリサイズ](features/column-resize.md))
- ソート状態、比較関数、ヘッダーのソート表示 ([ソート](features/column-sort.md))
- コンテンツ ツールバーのメニュー ボタンとチェックボックス メニュー ([表示カラムの切り替え](features/column-visibility.md))
- 状態は `playlistColumnsStore` に置き、この時点では保存しない

## Phase 3: 永続化

**ゴール: カラムの表示と幅が再起動後も復元される。**

- `AppSettings.playlistColumns` の追加と `sanitizePlaylistColumns` ([カラム設定の永続化](architecture/column-settings.md))
- `mergeSettings` / `sanitizeSettings` への組み込み
- ブートストラップでの store の初期化と、変更時の `mp:settings:set`

## Phase 4: 仕上げ

**ゴール: 見た目と文言が整い、配布できる。**

- en / ja の文言整備 (カラム名、メニュー ボタンのツールチップ)
- 横スクロール時のヘッダーとメニュー カラムの固定、ウィンドウ幅を変えたときの挙動の確認
- 大きなプレイリスト (1 万曲規模) でのスクロールとソートの確認

## フェーズ間の依存関係

- Phase 2 / 3 はともに Phase 1 のカラム定義に依存します
- Phase 2 のリサイズ・ソート・表示の切り替えは互いに独立しており、別々の PR にできます
- Phase 3 は Phase 2 の store に保存の経路を足すだけなので、Phase 2 の各 PR に含めても構いません
- Phase 4 は Phase 2 / 3 の完了後に行います
