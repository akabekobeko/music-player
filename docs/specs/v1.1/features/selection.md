# 曲リストの複数選択

複数選択の編集 ([複数選択の編集](multi-edit.md)) の入口となる、曲リストの選択モデルの共通化です。

## 現状 (v1.0)

- 選択モデル (`SelectionState` と純関数 `applySelectionClick`) は Artist ビューの `pages/artists/components/ArtistContent/` にあり、クリックで単一選択、Cmd / Ctrl でトグル、Shift で範囲選択を実装しています
- Album ビューの下段ペインと Playlist ビューの曲リストは `MusicRow` を使っていますが、選択状態を持ちません
- Artist ビューの曲メニュー「Add to playlist」は、行が複数選択に含まれていれば選択全体を対象にします (`playlistTargets`)

## v1.1 の変更

### 選択モデルの昇格

- `applySelectionClick` / `SelectionState` / `EMPTY_SELECTION` を `src/renderer/features/library/selection/` へ移動します。参照元が 2 つ以上になった時点で共有ディレクトリーへ昇格する規約 ([状態管理](../../v1.0/renderer/state-management.md)) に従います
- 選択状態そのものはビューごとの `useState` のままです (ビューをまたいで選択を共有しない)

### Album / Playlist ビューへの展開

- Album ビューの下段ペイン (`AlbumDetail`) と Playlist ビューの曲リスト (`PlaylistContent`) に、Artist ビューと同じクリック・修飾キーの選択を実装します
- 選択の描画は `MusicRow` の `selected` をそのまま使います (Artist ビューと同じ見た目)
- Playlist ビューは同じ曲が複数行に並ぶ場合があるため、選択の単位は行 (`position`) とし、ダイアログへ渡すときに曲 id で重複を除きます

### 曲メニューからの起動

- 曲メニュー「Song info」は、その行が複数選択に含まれていれば**選択中の全曲**を、含まれていなければ**その曲だけ**を対象にダイアログを開きます (`playlistTargets` と同じ規則。共通の導出関数 `menuTargetsOf` に切り出す)
- `musicInfoStore.open(musics)` は `readonly Music[]` を受け取ります
- メニュー文言は「Song info」のまま変えず、対象の件数はダイアログのタイトルで示します
- 曲行の右クリックメニューは [⋯] メニューと同じ項目を表示し、上記の対象の判定 (`menuTargetsOf`) もそのまま共有します

## 実装の順序

Artist ビューの動作を変えずに昇格 → Album ビュー → Playlist ビューの順に進め、それぞれ独立した PR にします。
