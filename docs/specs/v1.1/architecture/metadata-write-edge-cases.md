# メタデータ書き込みの注意点

[メタデータの書き込み](metadata-write.md) の補足です。タグ削除の表現、保持される項目、エラーの扱いをまとめます。

## タグ削除の扱い

mme の ID3v2 writer は `tag` 全体からフレームを再構築し、`undefined` と空文字をスキップします。したがって `undefined` にすればフレームは書かれず削除になります。ただし他フォーマット (MP4 / Vorbis Comment / APE / RIFF / ASF) の writer が既存フィールドを保持する実装だと削除にならないため、**Phase 1 で全フォーマットの結合テストを書き、削除にならないものがあれば mme 側を修正します** (自作パッケージのため対応可能)。

## 保持される項目

`saveTrack` には `loadTrack` の結果 (patch 対象以外のタグ、`trackTotal` / `discTotal`、pictures、chapters、lyrics、additionalFields) をそのまま渡すため、Parade が扱わない項目はファイルに残ります。`durationMs` は writer が書き戻さない読み取り専用値です。

## エラー

- mme の `MmeError` (`unsupported-format` / `invalid-tag` など) と Node の I/O エラー (EACCES、Windows での EBUSY など) は `toIpcError()` で正規化し、`failed[].error` に載せます
- 対象ファイルが存在しない (移動・リネーム済み) 場合は ENOENT が failed になります。v1.0 と同じく DB からの自動削除は行いません
