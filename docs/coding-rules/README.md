# コーディングルール

本リポジトリーのコーディングルール集です。リファクタリングの指針として随時追記します。

## ディレクトリー構成

### ページは route.tsx + components/PageContent.tsx で構成する

- ページのエントリーポイントは `pages/<page>/route.tsx` へ統一する
  - route.tsx はルート用コンポーネント (例: `AlbumsPage`) を export し、`<PageContent />` を返すだけにする
- ページの実装は `pages/<page>/components/PageContent.tsx` へ置く
  - コンポーネント名は `PageContent`、専用 Hooks は `usePageContent` とする
- PageContent が依存するページ固有のモジュール (Hooks・store・純関数・テスト) も `pages/<page>/components/` 配下へ置く

```
pages/albums/
├── route.tsx                  # エントリーポイント (PageContent を返すだけ)
└── components/
    ├── PageContent.tsx        # ページの実装
    ├── usePageContent.ts      # PageContent 専用 Hooks
    ├── albumFilterStore.ts    # ページ固有のモジュール
    ├── ...
    └── AlbumDetail/           # ページ固有の子コンポーネント
```

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

## スタイリング

### Flex レイアウトは stacks コンポーネントを利用する

- Flex レイアウトには基本的に `src/renderer/components/app/stacks.tsx` のコンポーネントを利用する
  - レイアウトが統一的になり、コンポーネント名からレイアウト方向を把握しやすくなる
- 使いわけ
  - 通常の縦レイアウトは `Stack`
  - 水平レイアウトは `HStack`
  - 中央寄せは `VStack`
  - Stack 系の中で上下・左右に分割したい場合は `justify-between` ではなく `Spacer` で間を埋める
- 例外 (素の flex クラスを許容するケース)
  - `header` / `nav` / `label` / `ul` などのセマンティック要素 (stacks は `div` を描画するため置き換えない)
  - `button` の子要素などインライン要素が必要な箇所
  - shadcn/ui 由来の `components/ui` 配下
  - 仮想スクロールの絶対配置行など、レイアウトが特殊な箇所

### gap のスケール

- 領域内の大項目は `gap-6`
- 中項目は `gap-4`
- 小項目は `gap-2`
  - `Stack` / `HStack` / `VStack` の規定値
  - 機能凝集の観点で密なものはこれを採用する (例: Form の Label と入力 UI)
