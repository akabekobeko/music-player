# ライブラリー管理

音楽ファイルのインポート、メタデータ管理、アートワーク管理の仕様です。処理はすべて Main プロセスで行います。

## インポートの入口

1. **ダイアログ**: `mp:dialog:openImportTargets` → `dialog.showOpenDialog` (`openFile` + `openDirectory` + `multiSelections`、対応拡張子フィルター)
2. **Drag & Drop**: ウィンドウ全域へのドロップを受け付ける
   - `webUtils.getPathForFile(file)` で絶対パスを取得 (preload の `mp.dnd.pathFor`)
   - `mp:dnd:expandPaths` で Main 側が再帰展開する
3. **アプリケーションメニュー**: File → Import… (`mp:menu:action` push → ダイアログと同じフロー)

いずれも展開済みファイル一覧を確認ダイアログ (件数と一覧) に表示し、ユーザーが Import を押してから `mp:library:import` を実行します (audio-player の ImportMusicDialog を踏襲)。

### パス展開の仕様

- 対応拡張子: `mp3, flac, m4a, mp4, ogg, opus, wav, aiff, aif, wma, ape` (mme core の対応範囲)
- ディレクトリー走査は再帰呼び出しではなくキュー方式 (audio-player 方式。深い階層でのスタックオーバーフロー回避)
- 走査深さの上限: 5 階層 (誤ってホームディレクトリーをドロップした場合の暴走防止。mme-gui は 3 だが、`音楽ルート/フォーマット別/アーティスト/アルバム/曲` 程度の構成を許容するため 5 とする)
- シンボリックリンクはスキップ

## インポート処理

```
for each file (セマフォで並列数 8):
  1. loadTrack(filePath) でメタデータ抽出        … mme core
  2. アートワークを SHA-256 名で保存 (後述)
  3. musics へ upsert、pictures / artist_pictures を更新
進捗: 100 件ごと + フェーズ変化時に mp:library:importProgress を push
完了: ImportSummary { imported, updated, failed: { filePath, error }[] } を返す
完了後: mp:library:changed を push → 各ビューが再取得
```

- メタデータ抽出 (`loadTrack`) は async のため並列化し、DB 書き込みは同期 API (`DatabaseSync`) のためキューで直列に流します。トランザクションは 100 件単位で分割し、Main のブロックを細切れにします
- **1 件の失敗は全体を止めません**。失敗は `ImportSummary.failed` に集約し、完了ダイアログで「N 件失敗 (詳細)」を表示します。audio-player の「console.error のみで UI に出ない」問題への対応です
- キャンセル (`mp:library:cancelImport`): ファイル境界でフラグをチェックして中断。処理済み分はコミットされたまま残します

### メタデータの取り込みマッピング

`Track` ([mme core](../architecture/tech-stack.md)) → `musics` テーブル:

| mme | musics 列 | 変換 |
| --- | --- | --- |
| `tag.title` | `title` | 空なら拡張子を除いたファイル名で補完 |
| `tag.artist` / `tag.albumArtist` | `artist` / `album_artist` | 未設定は空文字 |
| `tag.album` / `tag.genre` / `tag.composer` | `album` / `genre` / `composer` | 〃 |
| `tag.lyricist` / `tag.producer` / `tag.conductor` / `tag.publisher` | `lyricist` / `producer` / `conductor` / `publisher` | 〃 |
| `tag.discNumber` / `tag.trackNumber` | `disc` / `track` | 未設定は 1 / 0 |
| `tag.year` | `year` | 未設定・0 以下 (ジャンクタグ) は NULL |
| `tag.bpm` / `tag.rating` | `bpm` / `rating` | 未設定は NULL。rating は [0,1] 正規化値のまま |
| `durationMs` | `duration_ms` | VBR MP3 では推定値 ([技術選定](../architecture/tech-stack.md) の注意) |
| `audioFormat` | `audio_format` | |
| `pictures` | → アートワーク保存 | 下記 |

- `lyrics` / `chapters` は v1.0 では取り込みません (歌詞タイムラインは v1.x。取り込み時にスキーマ追加をマイグレーションで行う)
- `Track.warnings` はインポートログに記録します (UI 表示は失敗のみ)

## アートワーク管理

audio-player の content-hash 方式を継承します。

- `Track.pictures` から `kind === CoverFront (3)` を優先、なければ先頭の 1 枚を採用
- 画像データの SHA-256 をファイル名として `userData/images/<hash>.<ext>` に保存 (既存なら書き込みスキップ = 重複排除)
- `pictures` テーブルにパスを登録し、`musics.picture_id` で参照
- **アーティスト画像**: そのアーティストの曲を初めてインポートしたとき、その曲のアートワークを `artist_pictures` に自動登録します (audio-player で欠落していた機能)。以後のインポートでは上書きしません
- 表示は `media-file://` プロトコル経由 ([プロセス構成](../architecture/process-model.md))

## ライブラリーの更新・削除

- **再インポート**: 同じパスをインポートすると upsert でメタデータを更新します ([データベース](../architecture/database.md))
- **削除** (`mp:library:removeMusics`): musics から行を削除します。**音楽ファイル自体は削除しません**。プレイリストからは CASCADE で消えます。参照されなくなった pictures 行と画像ファイルは削除時にガベージコレクトします
- 存在しないファイル (移動・リネーム) の検出は v1.0 では行いません。再生時に open エラーとして通知されます ([オーディオエンジン](../renderer/audio-engine.md))
