# 一括取得の処理

メニューの「曲情報の取得」([メニューからの取得](../features/fetch-menu.md)) で `mp:musicbrainz:fetchMusicInfo` ([IPC 設計](ipc.md)) を受けた Main 側の手順です。検索は [検索と照合](lookup-strategy.md)、書き込みは v1.1 の [メタデータの書き込み](../../v1.1/architecture/metadata-write.md) をそのまま使います。

## 手順

```
runFetchMusicInfo({ musicIds }):
  1. musics から対象を取得 (未登録の id は failed)
  2. アルバム グループに分ける (lookup-strategy.md)
  for each group (直列):
    3. キャンセル フラグを確認 (立っていれば残りを打ち切り)
    4. グループの候補を組み立てる (release 検索 → lookup。失敗はグループ全曲を failed)
    for each music in group:
      5. 候補がなければ notFound
      6. 不足している項目を求める (features/missing-fields.md)
           patch  = 不足している項目に候補の値があるものだけ
           picture = アートワークがなく候補に画像があれば候補の画像
      7. patch も picture も空なら unchanged
      8. runUpdateMusics({ musicIds: [music.id], patch, picture }) で書き込み
           → updated / failed に集約
      9. mp:musicbrainz:fetchProgress { current, total, filePath, result } を push
 10. 1 件以上更新できたら mp:library:changed { kind: "updated" } を broadcast
 11. FetchMusicInfoSummary を返す
```

- 曲ごとに `patch` が異なるため、`runUpdateMusics` は 1 曲ずつ呼びます。孤児 GC と `mp:library:changed` は `runUpdateMusics` の責務ではなく呼び出し側 (v1.1 では `onUpdateMusics`、v1.2 では `onFetchMusicInfo`) が行うため、手順 10 でまとめて 1 回行います (`runUpdateMusics` にオプションは足しません)
- 進捗は「曲」単位で数えます。グループの検索中は `current` が進まないため、Renderer は最後に push された曲名の代わりに「<アルバム名> を検索中」を表示します ([取得ダイアログ](../features/fetch-dialog.md))
- 対象に現在再生中の曲が含まれる場合、v1.1 の適用と同じ理由で**書き込みの直前に停止**します。Renderer が `fetchInfoStore` の開始時に `player.commands.stop()` を呼び、確認ダイアログに注意文を出します

## キャンセル

- `mp:musicbrainz:cancelFetch` でフラグを立て、グループ境界と曲境界で確認します。進行中の HTTP リクエストは `AbortController` で中断します
- 処理済みの曲の書き込みは残します (インポートのキャンセルと同じ)
- 結果は `cancelled: true` の `FetchMusicInfoSummary` として返します

## 同時実行

- 一括取得は同時に 1 つだけです。実行中に 2 回目の `fetchMusicInfo` を受けたら `ok: false` (`code: "MB_BUSY"`) を返します
- 曲情報ダイアログの `lookupMusic` は一括取得中でも受け付けます。クライアントのキューで直列化されるため、レート制限は守られます ([レート制限の実装](rate-limit.md))

## 結果

| 分類 | 意味 |
| --- | --- |
| `updated` | 1 項目以上を書き込んだ曲 (`UpdatedMusic`。キューと現在曲の更新に使う) |
| `unchanged` | 候補はあったが不足がなかった、または不足分に候補の値がなかった曲 |
| `notFound` | 検索で該当がなかった曲 |
| `failed` | 通信・書き込みの失敗。`IpcError` つき |
| `cancelled` | キャンセルで打ち切ったかどうか |

`updated + unchanged + notFound + failed` は打ち切りがなければ対象数と一致します。
