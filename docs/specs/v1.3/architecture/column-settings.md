# カラム設定の永続化

カラムの表示、並び順、幅を `AppSettings` へ保存し、次回起動時に復元します。型は [型定義](column-settings-types.md) にまとめています。

## 保存するもの・しないもの

| 状態 | 保存 | 置き場所 |
| --- | --- | --- |
| 表示するカラムと並び順 | する | `AppSettings.playlistColumns.visibleIds` |
| カラムごとの幅 | する | `AppSettings.playlistColumns.widths` |
| ソート キーと向き | しない | `PlaylistContent` の `useState` ([ソート](../features/column-sort.md)) |
| リサイズ中の幅 | しない | `useColumnResize` の `useState` ([カラム幅のリサイズ](../features/column-resize.md)) |
| 並べ替えのドラッグ中の状態 | しない | `useColumnReorder` の `useState` ([カラムの並べ替え](../features/column-reorder.md)) |

設定は全プレイリスト共通です。プレイリストごとには持ちません ([スコープ](../scope.md))。

## 保存の形

- `visibleIds` は表示するカラムの id の配列です。配列の順序が表示順です ([カラムの並べ替え](../features/column-reorder.md))
- 常に表示するカラム (連番、タイトル、メニュー) は `visibleIds` に含めません。含まれていても無視します。連番とタイトルは左端、メニューは右端に置きます
- `widths` はユーザーがリサイズしたカラムだけを持ちます。未設定のカラムはカラム定義の既定幅を使います
- 設定が未保存 (`playlistColumns` が `undefined`) のときは、カラム定義の既定の表示と幅を使います

## sanitize

`settings.json` は壊れている可能性があるため、読み込み時と patch の適用時に検証します (`src/main/settings/sanitizePlaylistColumns.ts`)。

- 値がオブジェクトでなければ設定全体を無効とする (`undefined`。既定の表示と幅になる)
- `visibleIds` は文字列だけを残し、重複を除く (最初に現れた位置を残し、順序は保つ)。配列でなければ設定全体を無効とする
- `widths` は値ごとに、有限の数であることを確かめてから整数へ丸め、丸めた結果が 1 以上のものだけを残す (0.4 のような値は丸めて 0 になるため捨てる)
- `widths` がオブジェクトでない (文字列、配列、`null`) ときは `widths` だけを空 (`{}`) にし、`visibleIds` は生かす
- カラム id が既知かどうかは Main では判定しません。カラム定義は Renderer が持つため、未知の id は Renderer の解決時に捨てます (`resolveVisibleColumns`)。Main は型と値の範囲だけを守ります
- 最小幅への切り上げも Renderer の `resolveColumnWidths` で行います

`mergeSettings` では `sidebar` と同じく、patch に `playlistColumns` があれば sanitize した値で全体を置き換えます。Renderer は常に `{ visibleIds, widths }` の全体を送ります。

## store

Renderer 側は `sidebarStore` と同じ構成の `playlistColumnsStore` に置きます (`src/renderer/features/playlistColumns/`)。

- クラス + シングルトン。`useSyncExternalStore` で購読する
- 状態の遷移は純関数の reducer (`reducePlaylistColumns`) に切り出し、store は snapshot の保持と通知、保存の呼び出しだけを行う
- ブートストラップで `initialize(settings.playlistColumns)` を呼び、保存値を流し込む
- 変更のたびに、コンストラクターで注入した保存関数 (本番では `mp:settings:set`) を呼ぶ。ディスクへの書き込みは Main 側の debounce がまとめる

購読するのはコンテンツ ツールバーのカラム メニューと `PlaylistContent` の 2 か所です。両者は別のコンポーネント ツリーにあるため、React の外の store で共有します。

## 導出

表示に使う値はレンダー中に純関数で導出し、state には持ちません。

| 関数 | 入力 | 出力 |
| --- | --- | --- |
| `resolveVisibleColumns` | カラム定義、`visibleIds` | 表示するカラム定義 (表示順。常に表示するカラムを含む) |
| `resolveColumnWidths` | 表示するカラム定義、`widths` | カラム id ごとの幅 (保存値がなければ既定幅。最小幅へ切り上げ済み) |
| `fitTitleWidth` | カラム id ごとの幅、コンテナーの幅 | 表示に使う幅 (タイトルが不足分を引き受けた結果) |

適用の順序は次のとおりです。コンテナーの幅はリサイズ中の幅へ適用します ([カラム幅のリサイズ](../features/column-resize.md))。

```
resolveColumnWidths ─▶ useColumnResize (liveWidths) ─▶ fitTitleWidth ─▶ ヘッダーとセルの幅
```
