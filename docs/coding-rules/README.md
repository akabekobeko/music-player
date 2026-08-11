# コーディングルール

本リポジトリーのコーディングルール集です。リファクタリングの指針として随時追記します。

## コンポーネント設計

### ロジックは Custom Hooks へ分離する

- ロジック (状態管理、データ取得、派生データの計算、イベントハンドラーなど) はコンポーネントへ直書きしない
- ロジックは Custom Hooks としてファイル分割し、コンポーネントは Hooks の戻り値を表示 (JSX) へ反映することに専念する
- 特定のコンポーネント専用の Hooks は `useComponentName` と命名する
  - 例: `AlbumsPage` のロジックは `useAlbumsPage`
- Hooks のファイルは対象コンポーネントと同じディレクトリーへ配置する
  - 例: `pages/albums/AlbumsPage.tsx` と `pages/albums/useAlbumsPage.ts`

### useT はビュー層として扱う

- 翻訳 Hooks `useT` は JSX と同じビュー層の道具と位置づけ、コンポーネント側で呼ぶ (専用 Hooks の戻り値には含めない)
  - 翻訳キーは JSX に書かれるため、`t` をロジック Hooks の戻り値へ混ぜると層の分離が曖昧になる
  - 専用 Hooks を持たない表示専用サブコンポーネントも `useT` を呼ぶので、戻り値へ含めても「依存 Hooks の単一化」は徹底できない
- ロジック自体が翻訳文字列を必要とする場合のみ、Hooks 内で `useT` を呼んでよい
  - 例: `usePlaylistListPanel` (プレイリストの既定名)、`useImportConfirmDialog` (状態別の説明文)
