# メニューからの取得

曲・アーティスト・アルバムのメニューに「曲情報の取得」(i18n `menu.fetchMusicInfo`。en: `Fetch song info`、ja: `曲情報の取得`) を追加します。選ぶと対象の曲を [取得ダイアログ](fetch-dialog.md) に渡し、ユーザーが確認してから一括取得 ([一括取得の処理](../architecture/fetch-run.md)) を実行します。

## 配置

| 場所 | メニュー | 対象の曲 |
| --- | --- | --- |
| 曲リストの曲メニュー (Artists / Albums / Playlists 共通) | `RowMenu` の「Song info」の直後 | 「Song info」と同じ (`menuTargetsOf`。複数選択に含まれる行なら選択範囲、そうでなければその行) |
| Artists ビューのアーティスト メニュー (`ArtistHeader`) | 「Artist Info」の直前 | そのアーティストの全曲 (`playOrder`) |
| Artists ビューのアルバム メニュー (`AlbumHeaderRow`) | 「Album info」の直後 | そのアルバムの曲 |
| Albums ビューのアルバム メニュー (`AlbumDetail` ヘッダー) | 「Album info」の直後 | そのアルバムの曲 |

- アイコンは lucide の `CloudDownload` に統一します
- Unknown Artist (表示アーティストが空) のアーティスト メニューにも出します。アーティスト名なしでの検索は精度が落ちますが、曲単位の検索 ([検索と照合](../architecture/lookup-strategy.md)) にフォールバックするため実行はできます
- 「Song info」と同様、メニューは閉じた時点でアンマウントされるため、対象は `fetchInfoStore` に預けてアプリ レベルのダイアログ (AppLayout に 1 つ) が読みます ([取得ダイアログ](fetch-dialog.md))

## 活性条件

- 一括取得の実行中 (`fetchInfoStore` が `running`) はすべての「曲情報の取得」を非活性にします。同時実行は 1 つだけです ([一括取得の処理](../architecture/fetch-run.md))
- 対象が 0 曲になるメニュー (空のアルバムなど) は非活性にします

## 実行後

- 更新された曲はキュー・現在曲・MediaSession へ反映し (`PlayerCommands.updateMusics`)、各ビューは `mp:library:changed` で再取得します ([ライブラリーへの即時反映](../../v1.1/features/library-refresh.md))
- アーティスト名やアルバム名が補完された結果、表示中のアーティストやアルバムが変わる場合はルート追従 ([ルートの追従](../../v1.1/features/route-follow.md)) を `musicInfoStore.notifyApplied` と同じ経路で行います。`fetchInfoStore` が完了時に `AppliedUpdate` を流します
