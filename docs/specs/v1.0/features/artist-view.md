# Artist ビュー

アーティストを起点に音楽を眺めて再生するビューです。audio-player で唯一実装されていた画面を完成形に引き上げます。

## 画面構成

```
┌ Sidebar ────────┬ コンテンツ (/artists/:artistName) ─────────────┐
│ [検索ボックス]    │ ┌──────────────────────────────────────────┐ │
│ ● Artist A      │ │ (丸画像) Artist B                          │ │
│ ● Artist B ←選択 │ │          3 albums · 34 songs               │ │
│ ● Artist C      │ │          [▶ Play] [🔀 Shuffle]        [⋯]  │ │
│ ...             │ └──────────────────────────────────────────┘ │
│                 │ ▼ Album (year 昇順)                           │
│                 │ ┌ [Art] Album X  2001 · Rock · 41:02    [⋯] ┐ │
│                 │ │  1  Track title            3:28        [⋯] │ │
│                 │ │  2  Track title            4:11        [⋯] │ │
│                 │ └────────────────────────────────────────────┘ │
└─────────────────┴──────────────────────────────────────────────┘
```

## アーティスト一覧 (Sidebar)

- データ: `mp:library:getArtists` (名前、曲数、アートワーク)。`mp:library:changed` で自動再取得
- ソート: 冠詞 (`The` / `A` / `Thee`) を無視した名前順 (audio-player の `compareNameWithoutThe` を移植)
- テキスト検索ボックスで部分一致フィルター (クライアント側)
- アーティスト画像は `artist_pictures` 由来。なければ Lucide `UserRound` アイコン (v1.0 では自動登録により基本的に埋まる。[ライブラリー管理](library.md))
- クリックで `/artists/<name>` へ遷移

## アーティストヘッダー

- 画像、名前、アルバム数・曲数
- **Play**: そのアーティストの全曲 (アルバム年順 → disc → track 順) をキューに設定し、先頭から再生
- **Shuffle**: 同じ全曲をシャッフルした順でキューに設定して再生 (シャッフルは「キュー生成時に並びを混ぜる」方式。再生中の動的シャッフルモードは持たない)
- メニュー ([⋯]): Play / Shuffle / Add to playlist (audio-player では未実装だった `onSelect` を必ず実装する)

## 曲絞り込み (コンテンツツールバー)

- コンテンツツールバー右端のテキストボックス ([ルーティングとレイアウト](../renderer/routing-layout.md)) で、選択中アーティストの曲をタイトルの部分一致 (大文字小文字無視) で絞り込みます
- 絞り込み後の曲リストからアルバムを再グルーピングするため、一致曲を含まないアルバムはセクションごと非表示になります。ヘッダーのアルバム数・曲数や Play / Shuffle の対象も絞り込み結果を反映します
- クライアント側フィルターです (対象は選択中アーティストの曲のみで件数が限られるため)

## アルバムセクション

- グルーピングは Main の SQL で行い、キーは `(album_artist が空なら artist, album)` ([データベース](../architecture/database.md))。audio-player の Renderer 側 `albumsFromMusics` (album 文字列のみのキー) は使いません
- 並び: アルバムは year 昇順 (NULL は末尾)、曲は disc → track 昇順
- **disc 番号が複数ある場合は「Disc N」の小見出しで分割表示**します (audio-player では未使用だった `disc` 列の活用)
- アルバム行の表示: アートワーク (112px 角)、名前、年、ジャンル、曲数、総時間、メニュー
- アルバムメニュー: Play (このアルバムをキューに設定して再生) / Add to queue / Add to playlist

## 曲行

- トラック番号 / タイトル / 時間 (`duration_ms` 表示) / メニュー
- hover でトラック番号が ▶ に変わる。クリックまたはダブルクリックで再生
- 再生開始時のキュー: **選択したアルバムだけでなく、表示中アーティストの全曲 (アルバム年順)** をキューとし、クリック曲の位置から開始します (audio-player の挙動を踏襲。アルバムをまたいで聴き続けられる)
- 曲メニュー ([⋯]): Play / Play next (キューの次に挿入) / Add to queue (末尾) / Add to playlist / Remove from library
- 再生中曲のハイライトは [プレーヤー UI](player-ui.md) の共通仕様
- 選択状態 (クリックで選択、Shift/Cmd で複数選択) を実装し、複数曲まとめてプレイリストへ追加できるようにします

## 状態とデータフロー

- 選択アーティストはルートパラメーター (`/artists/:artistName`) が正。audio-player の `artistTab` Context state は廃止します
- 曲データはページのフック (`useArtistMusics(artistName)`) が `mp:library:getMusicsByArtist` で取得します。グローバル状態に持ちません
- 再生・キュー操作はすべて PlayerCommands ([状態管理](../renderer/state-management.md)) を呼ぶだけで、ビューはキューの中身を管理しません
