# v1.1

Parade v1.1 の仕様書です。v1.0 ([README](../v1.0/README.md)) で「読み取りのみ」としていた曲情報 (メタデータ) の編集と保存を追加します。

## テーマ

**曲情報ダイアログを編集可能にし、音楽ファイルへ書き戻す。**

- 曲情報ダイアログの入力欄を編集可能にし、変更があるときだけ活性化する適用ボタンを追加する
- アートワークの差し替えと削除ができる
- 複数の曲を選択して開いた場合は合成した情報を表示し、まとめて編集できる
- 適用は @akabeko/music-metadata-editor でファイルへ書き込み、DB とすべてのビューへ即時反映する
- form 編集と validation の管理に TanStack Form + zod を導入する

## 仕様書の構成

v1.0 と同じく、エントリーポイントを README、機能仕様を `features/` に置きます。1 ファイルの分量は日本語換算 1,000 文字を目安とし、超える場合は項目ごとに分割して分割元からリンクします。

### 計画

- [スコープ](scope.md)
  - v1.1 でやること・やらないこと
- [ロードマップ](roadmap.md)
  - 実装フェーズの分割と順序

### アーキテクチャー

- [form ライブラリー選定](architecture/form-library.md)
  - TanStack Form + zod の採用と要件。[選定理由](architecture/form-library-rationale.md)、[候補の比較](architecture/form-library-candidates.md)
- [IPC 設計](architecture/ipc.md)
  - 曲情報更新チャネルと変更通知の追加。[型定義](architecture/ipc-types.md)
- [メタデータの書き込み](architecture/metadata-write.md)
  - mme による書き込み手順、一時ファイル、DB 反映、孤児 GC。[注意点](architecture/metadata-write-edge-cases.md)

### 機能仕様

- [曲情報ダイアログの編集](features/music-info-dialog.md)
  - 編集可能な入力欄、適用ボタンの活性条件、閉じる操作
- [編集項目と validation](features/music-info-fields.md)
  - 項目ごとの型・制約・保存値への変換。[zod schema](features/music-info-schema.md)
- [アートワークの編集](features/artwork-edit.md)
  - Artwork タブでの差し替え・削除、複数選択時の扱い
- [複数選択の編集](features/multi-edit.md)
  - 合成表示、「ミックス」状態、変更判定の規則
- [曲リストの複数選択](features/selection.md)
  - 選択モデルの共通化と Album / Playlist ビューへの展開
- [適用処理](features/apply-flow.md)
  - Renderer 側の適用手順、進捗、失敗時の扱い、再生中の曲
- [ライブラリーへの即時反映](features/library-refresh.md)
  - Artists / Albums / キューへの反映。[ルートの追従](features/route-follow.md)

## リリース

v1.1 はマイナーリリースです。機能 PR には `release:minor` ラベルを付与します ([リリース フロー](../../release.md))。
