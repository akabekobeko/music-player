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

### 1 ファイル 1 関数・クラスにする

- モジュール (`.ts`) は原則として 1 ファイルにつき 1 つの関数またはクラスを export し、ファイル名は export 名と一致させる
  - 例: `moveItem.ts` は `moveItem` のみを export する
- 代表となる関数・クラスと、それだけが使うサブルーチンがある場合は、代表名のサブディレクトリーを作成して集約する
  - 例: `buildConditionSql/buildConditionSql.ts` + `buildConditionSql/escapeLikePattern.ts`
  - import パスは `…/buildConditionSql/buildConditionSql` となる
- 複数の関数から共有されるヘルパー・定数・型は独立ファイルへ切り出す (代表が 1 つに定まらないため同階層へフラットに置く)
- 定数のみの export は分割対象外とする
  - 単一の関数だけが使う定数・型はその関数のファイルへ同居させる (例: `seekTargetFrom.ts` の `SEEK_STEP_SEC`)
- re-export だけのバレルファイル (`index.ts` など) は作らない
- テストもソースの分割に合わせて per-function に分割し、対象ファイルと同名の `foo.test.ts` を同じ場所へ置く

例外 (分割しない):

- モジュールレベルの可変状態を共有する関数群 (例: `settingsManager.ts`、`playerBridge.ts`)
  - 状態を共有しない純関数が同居している場合、その純関数だけ切り出す (例: `db/connection.ts` から `backupBeforeMigration.ts`)
- クラスとそのシングルトンインスタンス (例: `toastStore.ts` の `ToastStore` クラスと `toastStore`)
- React の Provider とその Context / hooks (例: `PlayerProvider.tsx`)
- vitest の `vi.mock` 対象モジュール (例: `src/test/electron.mock.ts`)

## コンポーネント設計

### 1 ファイル 1 コンポーネントにする

- コンポーネント (`.tsx`) は 1 ファイルにつき 1 つとし、ファイル名はコンポーネント名と一致させる
- 複数のコンポーネントを含むファイルは、それぞれのコンポーネント名でファイル分割する
  - 例: `QueuePopover.tsx` から `ClearQueueButton.tsx` / `QueueList.tsx` を分割
- 例外
  - `stacks.tsx` のように 1 つの `type Props` を共有する意図的なプリミティブ集
  - Provider ファイル内の Context 定義と hooks (UI コンポーネントではないため)
  - shadcn/ui 由来の `components/ui` 配下

### props 型は type Props へ括り出す

- コンポーネントの props 型はインラインの型注釈で書かず、ファイル冒頭で `type Props = { … }` として定義する
- プロパティは `readonly` とし、補足が必要なものには JSDoc コメントを付ける

```tsx
type Props = {
  readonly album: AlbumSummary;
  /** Card width in px, computed by the grid layout. */
  readonly width: number;
};

export const AlbumCard = ({ album, width }: Props) => { … };
```

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

### margin を使わない

- `m-N` / `mt-N` / `ml-N` などの margin ユーティリティで間隔を調整しない (`components/ui` 配下を除く)
- 代わりに次の優先順で対応する
  1. 隣接要素との間隔調整なら、親要素 Stack 系の `gap` を利用する
  2. 親要素が Stack 系でないなら Stack 系へ移行する
     - 間隔を変えたい要素だけをグループ化する場合は、入れ子の Stack 系で括る (例: sort グループと limit グループを各 `HStack` にして親を `gap-4` へ)
  3. 親要素を Stack とするまでもない場合は、親要素 (またはラッパー要素) の `padding` で調整してよい
     - 例: `details` は flex 化すると `summary` のマーカーが壊れるため、展開部をラッパー `div` の `pt-2` で調整
- margin は要素の「外側」の都合を要素自身に持たせてしまい、再配置時に間隔が壊れるため避ける
