# メタデータの書き込み

`mp:library:updateMusics` ([IPC 設計](ipc.md)) の Main 側処理です。@akabeko/music-metadata-editor (mme) でファイルへ書き込み、インポートと同じ経路で DB へ取り込み直します。

## 原則

- **ファイルが正、DB はキャッシュ**: DB を `patch` から直接更新せず、書き込み後にファイルを読み直して upsert する。タイトル空欄時のファイル名補完や不正な年の NULL 化など、インポートのマッピング (`mapTrackToMusicRow`) をそのまま再利用できる
- **元ファイルを壊さない**: 一時ファイルへ書き出してから置き換える。mme の `saveTrack` は `writeFile` で直接上書きするため、Parade 側で置き換えを担う
- **直列処理**: ファイル書き込みは 1 件ずつ順に行う (インポートの読み取りと違い、並列化の利益より I/O 競合の不利益が大きい)

## 1 件あたりの手順

```
for each musicId (直列):
  1. musics から file_path を取得 (未登録なら failed)
  2. loadTrack(filePath) で Track を取得
  3. tag へ patch を合成
       文字列: "" → undefined (タグ削除)、それ以外はそのまま
       year / bpm / rating: null → undefined、track / disc は数値のまま
     picture があれば pictures を書き換え (下記)
  4. saveTrack(edited, { source: filePath, outputPath: <同じディレクトリーの一時ファイル> })
  5. rename(一時ファイル → filePath) で置き換え (失敗時は一時ファイルを削除して failed)
  6. loadTrack(filePath) で読み直し → mapTrackToMusicRow → upsertMusic
  7. picture_id の更新 (下記)
  8. 進捗 mp:library:updateProgress を push
完了後 (1 件以上更新できた場合):
  9. 孤児 GC (cleanupLibraryOrphans): artist_pictures / artist_initials / pictures
 10. 新しい表示アーティストに画像がなければ registerArtistPictureIfMissing
 11. mp:library:changed { kind: "updated" } を broadcast
```

- 一時ファイル名は `<元ファイル名>.parade-tmp` とし、同じディレクトリーに置く (同一ボリューム内の rename で置き換えるため)
- 手順 3 の `pictures`: 代表画像 (`selectArtworkPicture` が選ぶ `CoverFront`、なければ先頭) を取り除き、差し替えなら新しい画像を `CoverFront` として先頭に加える。削除なら取り除くだけ。他の画像 (裏ジャケットなど) は保持する
- 手順 7 の `picture_id`: 差し替えは再読込した `pictures` からインポートと同じく `saveArtwork` (SHA-256 名) → `getOrCreatePictureId` で得た id を upsert に渡す。削除は upsert 後に `picture_id = NULL` を明示的に書く (upsert の `COALESCE` は「アートワークなし = 維持」の意味であり、削除を表せないため)
- 手順 6 の upsert は 1 件ずつトランザクションにする。ファイルの置き換えが成功して DB 更新だけ失敗した場合も failed として報告する (次回の再インポートで整合する)
- `Track.warnings` はインポートと同様にログへ記録する

タグ削除の表現、保持される項目、エラーの扱いは [メタデータ書き込みの注意点](metadata-write-edge-cases.md) を参照してください。
