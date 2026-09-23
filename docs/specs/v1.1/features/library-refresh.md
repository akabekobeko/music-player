# ライブラリーへの即時反映

適用の結果を Artists / Albums / Playlists 各ビューとカレントキューへ即時に反映する仕様です。アルバム アーティストやアルバム名の変更は表示上のグルーピングを変えますが、ファイルの移動やリネームは行いません ([スコープ](../scope.md))。

## クエリストアの再取得

- Main は 1 件以上更新できたとき `mp:library:changed { kind: "updated" }` を broadcast します
- Renderer はブートストラップで登録済みの購読で `libraryStore.invalidate()` を呼び、購読中のキー (アーティスト一覧、アルバム一覧、曲一覧、フィルター選択肢、統計) を再取得します。v1.0 のインポート・削除と同じ経路で、追加実装はありません
- 再取得の完了で Artists サイドバーのグルーピング、Albums グリッドのカード、各曲リストの表示が更新されます

## カレントキューと現在曲

キューと現在曲は PlayerProvider の state であり、クエリストアの再取得では更新されません。

- PlayerCommands に `updateMusics(musics: readonly Music[])` を追加し、reducer の Action `musicsUpdated` で `queue` と `current` の同 id の要素を差し替えます (純関数 `replaceMusics`)
- 現在曲が差し替わった場合はコマンド内で MediaSession の metadata を更新します
- 適用処理 ([適用処理](apply-flow.md)) は `updated` を受け取ったらこのコマンドを呼びます。停止した現在曲も表示 (PlayerBar のタイトル・アーティスト) は新しい値になります

表示アーティストやアルバムキーが変わった場合の画面の追従は [ルートの追従](route-follow.md) を参照してください。
