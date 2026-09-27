# カラム幅のリサイズ

ヘッダーの境界をドラッグしてカラムの幅を変えます。先行例の `useColumnResize` と同じ方式です。

## 操作

- リサイズできるカラム ([カラム定義](columns.md)) のヘッダーの右端に、幅 6px のハンドルを置きます。ホバーでカーソルが `col-resize` になり、ハンドルに色が付きます
- ハンドルを左右へドラッグすると、そのカラムの幅が変わります。右隣以降のカラムは幅を保ったまま左右へずれます
- ドラッグ中はヘッダーとすべての行のセルが追従します
- ポインターを離すと幅を確定し、設定へ保存します ([カラム設定の永続化](../architecture/column-settings.md))
- ハンドルの操作はヘッダーのクリックとして扱いません。リサイズでソートが切り替わらないようにします

## 幅の範囲

| 項目 | 値 |
| --- | --- |
| 最小幅 | 48px (`MIN_COLUMN_WIDTH`)。これより狭くはドラッグできない |
| 最大幅 | なし。コンテナーを超えた分は横スクロールする |
| 確定時の丸め | 整数 (`Math.round`) |

最小幅は、誤って狭くしたカラムのハンドルをつかめなくなることを防ぎます。保存値が 1 以上で最小幅を下回る場合は、表示のときに最小幅へ切り上げます (`resolveColumnWidths`)。数値でない値や 0 以下の値は保存値として扱わず、既定幅を使います ([カラム設定の永続化](../architecture/column-settings.md) の sanitize)。

## タイトル カラムの扱い

v1.2 ではタイトルが残りの幅をすべて使っていました。カラム幅を px で持つと、ウィンドウが広いときに右側へ空白ができます。これを避けるため、**カラム幅の合計がコンテナーより狭いときは、タイトル カラムが不足分を引き受けます。**

```
タイトルの表示幅 = max(タイトルの幅, コンテナーの幅 - 他のカラムの幅の合計)
```

- 合計がコンテナー以上のときは、すべてのカラムが指定どおりの幅になり、横スクロールします
- 他のカラムを広げると、まずタイトルの引き受けている分が縮み、タイトルが指定の幅に達したところで横スクロールが始まります
- メニュー カラムは常に右端にあります

コンテナーの幅は `ResizeObserver` で取得します。外部 (DOM) の値の購読なので `useSyncExternalStore` で扱います ([状態管理](../../v1.0/renderer/state-management.md))。

### タイトルのドラッグ

タイトルのハンドルは、ドラッグの量と見た目の変化が一致するように次の規則で動かします。

- 開始値は保存値ではなく**表示中の幅**です (引き受けた分を含む)
- 下限は `max(最小幅, コンテナーの幅 - 他のカラムの幅の合計)` です。不足分を引き受けている間は、それより狭くできません。狭くしても表示が変わらず、保存値だけが動くことを避けます
- 広げる方向は制限しません。広げた分だけ横スクロールします
- 確定した幅が開始値と同じなら保存しません

## 実装

```ts
// src/renderer/pages/playlists/components/PlaylistTable/useColumnResize.ts
type Args = {
  /** Resolved widths in pixels, keyed by column id. */
  readonly baseWidths: Readonly<Record<PlaylistColumnId, number>>;
  /** Persists the final width; called once when the drag ends. */
  readonly onColumnResize: (id: PlaylistColumnId, width: number) => void;
};
```

- ドラッグ中の幅は hook の `useState` に持ち、`baseWidths` を上書きして返します (`liveWidths`)。store と設定はドラッグの終了まで変えません
- 表示に使う幅は `fitTitleWidth(liveWidths, containerWidth)` で導出します。ドラッグ中の幅へ適用するため、他のカラムを広げている間もタイトルが追従して縮みます ([カラム設定の永続化](../architecture/column-settings.md) の導出)
- `beginResize(event, columnId, startWidth, minWidth)` の開始値と下限は呼び出し側 (ヘッダー) が渡します。ヘッダーは表示中の幅を知っているため、hook がコンテナーの幅を持つ必要はありません
- `pointerdown` でハンドルに `setPointerCapture` し、`pointermove` / `pointerup` / `pointercancel` をハンドルで受けます。ユーザー操作を起点とするイベント ハンドラーなので useEffect は使いません
- 幅が変わらなかったとき (クリックだけ) は保存しません

## 既定値へ戻す

ハンドルのダブルクリックで、そのカラムの幅を既定幅へ戻します (`widths` から該当の id を除く)。全カラムをまとめて戻す操作はカラム メニューに置きます ([表示カラムの切り替え](column-visibility.md))。
