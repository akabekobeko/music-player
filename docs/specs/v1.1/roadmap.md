# ロードマップ

v1.1 の実装フェーズ分割です。v1.0 と同じく「動くものが確認できる」単位で区切り、順に積み上げます。詳細タスクは実装時に issue 化します。

```
Phase 1  書き込み基盤     updateMusics IPC / mme 書き込み / DB 反映 / 孤児 GC
Phase 2  単曲編集         TanStack Form + zod / Details タブの編集 / Artwork タブの編集 / 適用ボタン
Phase 3  複数選択編集     選択モデルの共通化 / 合成表示 / ミックス状態
Phase 4  反映と仕上げ     キュー更新 / ルート追従 / 全フォーマットの往復確認
```

## Phase 1: 書き込み基盤

**ゴール: IPC 経由で曲のタグを書き換え、DB に反映される (UI なし)。**

- `mp:library:updateMusics` と `mp:library:updateProgress` ([IPC 設計](architecture/ipc.md))
- 一時ファイル経由の `saveTrack`、再読込による upsert、孤児 GC ([メタデータの書き込み](architecture/metadata-write.md))
- アートワークの差し替え・削除 (`pictures` の書き換えと `picture_id` の更新)
- 空文字によるフィールド削除が全フォーマットで機能するかの結合テスト。不足があれば mme 側を修正する
- `mp:library:changed` に `kind: "updated"` を追加

## Phase 2: 単曲編集

**ゴール: 1 曲の曲情報を編集して保存できる。**

- TanStack Form + zod の導入と `TagField` の編集対応 ([form ライブラリー選定](architecture/form-library.md))
- 項目ごとの validation とエラー表示 ([編集項目と validation](features/music-info-fields.md))
- 適用ボタンの活性条件、適用中の表示、失敗時の表示 ([曲情報ダイアログの編集](features/music-info-dialog.md)、[適用処理](features/apply-flow.md))
- Artwork タブの編集 (ファイル選択、プレビュー、削除) ([アートワークの編集](features/artwork-edit.md))

## Phase 3: 複数選択編集

**ゴール: 複数の曲をまとめて編集できる。**

- 選択モデルを `features/library/selection/` へ昇格し、Album / Playlist ビューへ展開 ([曲リストの複数選択](features/selection.md))
- 合成表示 (`mergeMusics`) とミックス状態、変更判定 ([複数選択の編集](features/multi-edit.md))。アートワークのミックス表示を含む
- 曲メニューの Song info を選択範囲で開く

## Phase 4: 反映と仕上げ

**ゴール: 編集結果がアプリ全体に即時反映され、配布できる。**

- カレントキュー・現在曲・MediaSession の更新 ([ライブラリーへの即時反映](features/library-refresh.md))
- Artist / Album ビューのルート追従 (表示アーティストやアルバムが変わった場合)
- 対応フォーマット (mp3 / flac / m4a / ogg / opus / wav / aiff / wma / ape) での編集往復 QA

## フェーズ間の依存関係

- Phase 2 は Phase 1 の IPC に依存します。Phase 1 はユニットテストのみで完結できます
- Phase 3 の選択モデル共通化は Phase 2 と並行して進められます
- Phase 4 は Phase 2 / 3 の完了後に行います
