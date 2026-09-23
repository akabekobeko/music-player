# 適用処理

曲情報ダイアログの Apply を押してから閉じるまでの Renderer 側の流れです。Main 側の書き込みは [メタデータの書き込み](../architecture/metadata-write.md) を参照してください。

## 手順

```
1. 変更ありの項目を toMusicTagPatch で MusicTagPatch に変換
   アートワークを選んでいれば File.arrayBuffer() で Uint8Array に読み、picture に載せる (Remove なら null)
2. 対象に現在曲が含まれていれば player.commands.stop() (下記)
3. applying = true (Apply / Cancel を非活性、Apply にスピナー)
4. mp:library:updateMusics({ musicIds, patch }) を invoke
     進捗は mp:library:updateProgress を購読して「current / total」を Apply の横に表示
5. 応答を処理
     ok: false            → エラーを表示して終了 (入力検証エラー。通常は起きない)
     failed が 0 件        → ライブラリー反映 (library-refresh.md) → ダイアログを閉じる
     failed が 1 件以上    → 更新できた分をライブラリーへ反映し、失敗一覧を表示して開いたまま
```

- `musicIds` が空でも `patch` が空でも `picture` があれば送ります。すべて空のときは Apply が非活性なので到達しません
- 手順 1〜5 は `useMusicInfoDialog` の `apply` コマンド (async 関数) に置きます。useEffect で状態を監視して発火する形は取りません ([状態管理](../../v1.0/renderer/state-management.md))
- 進捗の購読はダイアログのコンポーネント寿命に閉じ、`useSyncExternalStore` で読みます

## 失敗時の表示

- 失敗一覧は Details タブの下 (Artist 編集ダイアログのエラー表示と同じ位置) に「N 件失敗」と、ファイル名とメッセージのリストで表示します
- フォームの初期値は適用前のまま据え置き、入力値も保持します。Apply は活性のままで、押し直すと全対象に同じ patch を再送します。成功済みの曲へ同じ値を書き直しても結果は変わらないため、再試行を単純に保てます
- 失敗した曲だけを再送する最適化は行いません (対象の絞り込みとミックス判定が複雑になるため)

## 再生中の曲

対象に PlayerProvider の現在曲 (`current`) が含まれる場合、**適用前に再生を停止します**。

- 理由: `media-stream://` は要求のたびにファイルを開いて Range を返すため、置き換え中のファイルを読むと再生が壊れる。Windows では開いているファイルの rename が失敗する
- 停止後は停止状態のままにし、自動で再開しません。現在曲の表示は更新後のメタデータへ差し替えます ([ライブラリーへの即時反映](library-refresh.md))
- Apply の直前に確認は出しません。ダイアログを開いた時点で対象に現在曲があれば、フッターに「適用すると再生を停止します」の注意文を表示します

## 適用後

- 成功時はダイアログを閉じ、通知 (toast) は出しません。ビューが即時に更新されることで結果が分かります
- `musicInfoStore` の subject は閉じるときに `null` へ戻します。適用結果で subject を差し替えることはしません (開き直せば最新の値になる)
