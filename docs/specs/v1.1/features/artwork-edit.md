# アートワークの編集

曲情報ダイアログの Artwork タブで、曲に埋め込まれたアートワーク (フロントカバー) を差し替え・削除する仕様です。UI は Artist 編集ダイアログの Picture タブ (画像ファイルの選択とプレビュー) を踏襲します。

## 画面構成

```
┌ [Details] [Artwork] [File] ──────────────┐
│           ┌──────────────┐               │
│           │   プレビュー    │  ← aspect-fit  │
│           └──────────────┘               │
│ [Choose file…]  cover.jpg      [Remove]   │
└──────────────────────────────────────────┘
```

- プレビューは現在のアートワーク (`media-file://`) か、選択した画像ファイルの object URL。なければプレースホルダーアイコン (`Music`)
- 画像ファイルの選択は `<input type="file" accept="image/*">`。対応 MIME は `IMAGE_EXTENSION_BY_MIME` (jpeg / png / gif / webp / bmp) で、それ以外は選択時にエラー表示して受け付けない
- Remove はアートワークを削除する操作。押すとプレビューがプレースホルダーになり、選択中のファイルがあれば取り消す
- タブは `keepMounted` にし、他タブへ切り替えてもファイル選択とプレビューを保つ (Artist 編集ダイアログと同じ)

## 編集状態

アートワークはフォームの項目ではなく、`useMusicInfoDialog` が別途 `pictureChange` として持ちます。

| `pictureChange` | 意味 |
| --- | --- |
| `null` | 未編集。適用対象にしない |
| `{ file }` | 選択したファイルで差し替える |
| `"clear"` | アートワークを削除する |

- 適用ボタンの活性条件 ([曲情報ダイアログの編集](music-info-dialog.md)) は「タグの変更あり **または** `pictureChange !== null`」です
- 複数選択でアートワークが一致しない場合はプレースホルダーを表示します (ミックス)。`pictureChange` が `null` のままなら各曲のアートワークはそのまま残り、ファイルを選ぶか Remove を押すと全曲に適用されます ([複数選択の編集](multi-edit.md))
- 同じ画像を選び直しても差分判定はしません (選んだ時点で変更あり)。適用しても内容ハッシュが同じなら画像ファイルは重複保存されません

## 適用

- Renderer は `File` を `Uint8Array` に読み ([適用処理](apply-flow.md))、`UpdateMusicsRequest.picture` に `{ mimeType, data }` または `null` (削除) を載せます ([IPC 型定義](../architecture/ipc-types.md))。`setArtistPicture` と同じ運び方です
- Main はファイルの `pictures` を書き換え、再読込で `picture_id` を更新します ([メタデータの書き込み](../architecture/metadata-write.md))
- アーティスト画像 (`artist_pictures`) は上書きしません。表示アーティストに画像がない場合だけ、インポートと同じ規則で新しいアートワークを登録します

## 反映

- 画像ファイルは内容ハッシュ名なので、差し替え後の `picturePath` は必ず別の URL になり、キャッシュの問題は起きません
- Albums グリッドの代表アートワークと曲リストはクエリストアの再取得で、PlayerBar の現在曲は `updateMusics` コマンドで更新されます ([ライブラリーへの即時反映](library-refresh.md))
