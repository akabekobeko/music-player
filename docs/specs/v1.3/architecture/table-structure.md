# テーブルの構造

Playlists のテーブルの要素構成と、ヘッダーの固定・Virtualization・横スクロールの方法です。

## 要素の構成

```
PlaylistContent
├── PlaylistHeader                 名前 / 曲数 / 総時間 / Play / Shuffle / メニュー (v1.2 のまま)
└── div (スクロール コンテナー)      overflow: auto。virtualizer の scroll element
    └── table (PlaylistTable)
        ├── thead (PlaylistTableHeader)   position: sticky; top: 0
        │   └── tr > th ...
        └── tbody (PlaylistTableBody)     display: block; position: relative; 高さ = 全行の合計
            └── tr (PlaylistTableRow) ... position: absolute; translateY
                └── td ...
```

- スクロール コンテナーは `PlaylistHeader` の下の領域全体です。`PlaylistHeader` は v1.2 と同じくスクロールしません
- コンポーネントは `pages/playlists/components/PlaylistTable/` に置きます ([コーディングルール](../../../coding-rules/README.md))

## レイアウト

`<table>` の要素を使いつつ、表のレイアウト アルゴリズムは使いません。先行例と同じ方式です。

- `<tr>` は `display: flex`、`<th>` / `<td>` は `flex-shrink: 0` とし、幅を px で直接指定する
- 幅はヘッダーとセルで同じ関数 (`widthOf(columnId)`) から得るため、リサイズ中も列がずれない
- テーブル全体の幅は表示中のカラム幅の合計。コンテナーより狭いときの扱いは [カラム幅のリサイズ](../features/column-resize.md) を参照

`display` を上書きすると要素の暗黙の role が失われることがあるため、`role` (`table` / `rowgroup` / `row` / `columnheader` / `cell`) を明示します。ソート中のヘッダーには `aria-sort` を付けます。

## ヘッダーの固定

- `<thead>` に `position: sticky; top: 0` と不透明な背景色を指定する
- 重なり順は「再生中の行 (glow) < ヘッダー」。ヘッダーの下を通る行の glow が、ヘッダーへはみ出して見えないようにする
- 下端に境界線を引き、スクロールした行との区切りを示す

## Virtualization

v1.2 の `useVirtualizer` の設定 (`estimateSize: MUSIC_ROW_HEIGHT`、`overscan: 12`) を引き継ぎます。

- `<tbody>` の高さを `virtualizer.getTotalSize()` とし、表示範囲の行だけを `translateY` で配置する
- ヘッダーの高さは定数 (`PLAYLIST_TABLE_HEADER_HEIGHT`、32px) とする。計測を避け、Virtualization の補正に同じ値を使う
- ヘッダーはスクロール コンテナー内で行より前にあるため、`scrollMargin` にヘッダーの高さを指定する。`virtualItem.start` は `scrollMargin` を含み、行は `<thead>` の下から始まる `<tbody>` の中で配置するので、行の位置は `translateY(virtualItem.start - scrollMargin)` とする
- `scrollPaddingStart` にもヘッダーの高さを指定し、`scrollToIndex` で移動した行が固定したヘッダーに隠れないようにする
- カラムは Virtualization しない。表示するカラムは多くても十数個で、行ごとのセル数が描画の負荷にならない

## 横スクロール

カラム幅の合計がコンテナーを超えると横スクロールします。

- ヘッダーは行と同じコンテナー内にあるため、行と一緒に横へ動く
- メニュー カラムは `position: sticky` で右端に固定し、横スクロール中も [⋯] を押せるようにする。ヘッダー側のメニュー カラムも同様
- sticky の要素はスクロール コンテナーの padding の内側で止まる。`right: 0` ではメニュー カラムとコンテナーの右端の間に padding の幅だけ隙間が残り、下を通るセルがそこから見える。`right` を padding の負の値 (`PLAYLIST_TABLE_MENU_STICKY_RIGHT`) とし、コンテナーの右端へ密着させる。横スクロールの終端では行の右端がメニュー カラムを押さえるため、行の中の本来の位置へ収まる
- 行の背景 (ホバー、選択) は行の全幅へ広げる。固定したメニュー カラムのセルは、下を通るセルが透けないよう行と同じ背景色を持つ。行の背景色を CSS 変数 (`--row-bg`) で持ち、セルも同じ変数を使う。セルは不透明でなければならないため、ホバーの色は `MusicRow` の半透明の色をページの背景色と混ぜた不透明な色にする
- スクロール コンテナーに `scroll-padding-inline-end` (メニュー カラムの幅) を指定する。キーボードのフォーカスでヘッダーのボタンへ横スクロールしたときに、固定したメニュー カラムの下へ隠れないようにする
- 再生中の行の枠線は、行の疑似要素でセルの上へ描く。行そのものの影にすると、不透明なメニュー カラムのセルが覆ってしまうため。glow は行の外側の影のままとする

## 行の見た目

`MusicRow` の見た目を `PlaylistTableRow` でも保ちます。

- ホバーと選択の角丸の背景、再生中の行の枠線と glow
- 連続する選択行の角丸の結合 (`selected-above` / `selected-below`。行の要素が `<tr>` に変わっても、隣り合う行を兄弟セレクターで判定する方式は同じ)
- 行の高さは `MUSIC_ROW_HEIGHT` (36px)

`MusicRow` は Artists / Albums ビューで引き続き使うため変更しません。先頭セルの再生ボタン (`PlayingButton` など) と `RowMenu` は共有します。
