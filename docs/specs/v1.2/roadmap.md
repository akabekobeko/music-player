# ロードマップ

v1.2 の実装フェーズ分割です。v1.1 と同じく「動くものが確認できる」単位で区切り、順に積み上げます。詳細タスクは実装時に issue 化します。

```
Phase 1  クライアント基盤   MusicBrainz クライアント / User-Agent / レート制限 / 検索・照合 / マッピング
Phase 2  一括取得           メニュー項目 / 取得ダイアログ / Main の一括処理 / 不足の補完
Phase 3  ダイアログ取得     取得ボタン / Details タブの比較 / Artwork タブの比較 / 採用の適用
Phase 4  仕上げ             オフライン・失敗時の文言 / i18n / 実データでの QA
```

## Phase 1: クライアント基盤

**ゴール: Main プロセスで 1 曲分の候補 (`MusicInfoCandidate`) を組み立てられる (UI なし)。**

- `MusicBrainzClient` と直列化・待機・再試行 ([MusicBrainz クライアント](architecture/musicbrainz-client.md)、[レート制限の実装](architecture/rate-limit.md))
- User-Agent の組み立て ([User-Agent と設定の検討](architecture/user-agent.md))
- 検索クエリーの組み立てと Lucene エスケープ、release / recording の lookup ([検索と照合](architecture/lookup-strategy.md)、[検索クエリー](architecture/search-query.md))
- 応答から `MusicInfoCandidate` へのマッピング ([メタデータのマッピング](architecture/metadata-mapping.md))。応答 JSON をフィクスチャーに保存してユニットテストする
- Cover Art Archive からのフロントカバー取得

## Phase 2: 一括取得

**ゴール: メニューから選択範囲の曲の不足分を補完できる。**

- `mp:musicbrainz:fetchMusicInfo` / `fetchProgress` / `cancelFetch` ([IPC 設計](architecture/ipc.md))
- アルバム単位のグループ化、不足判定、`runUpdateMusics` による書き込み ([一括取得の処理](architecture/fetch-run.md)、[不足しているメタデータの定義](features/missing-fields.md))
- 曲・アーティスト・アルバムのメニュー項目 ([メニューからの取得](features/fetch-menu.md))
- 確認・進捗・完了のダイアログと `fetchInfoStore` ([取得ダイアログ](features/fetch-dialog.md))

## Phase 3: ダイアログ取得

**ゴール: 曲情報ダイアログで取得結果を見比べて項目ごとに採用できる。**

- `mp:musicbrainz:lookupMusic` と Footer の取得ボタン ([曲情報ダイアログの取得ボタン](features/music-info-fetch.md))
- Details タブの 2 列表示、採用チェックボックス、採用側の枠線色 ([Details タブ](features/music-info-compare.md)、[採用色の選定](features/adopt-color.md))
- Artwork タブの左右表示と採用の切り替え ([Artwork タブ](features/artwork-compare.md))
- 採用結果を `toMusicTagPatch` と `picture` へ合成して適用

## Phase 4: 仕上げ

**ゴール: 失敗時の挙動が分かりやすく、配布できる。**

- オフライン・タイムアウト・503 連続時の文言と再試行案内
- en / ja の文言整備
- 実ライブラリー (タグ欠損の多い曲、コンピレーション、多枚組) での照合精度の確認と閾値の調整

## フェーズ間の依存関係

- Phase 2 / 3 はともに Phase 1 のクライアントに依存します。Phase 1 はフィクスチャーによるユニットテストで完結できます
- Phase 2 と Phase 3 は独立しており並行して進められます
- Phase 4 は Phase 2 / 3 の完了後に行います
