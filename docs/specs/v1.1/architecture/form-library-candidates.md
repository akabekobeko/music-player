# form ライブラリー候補の比較

[form ライブラリー選定](form-library.md) で検討した候補の比較です。バージョンは 2026-09 時点の最新安定版です。

## 比較表

| 観点 | TanStack Form 1.33 | conform 1.21 | React Hook Form 7.88 |
| --- | --- | --- | --- |
| 設計の中心 | headless な store。値は state | `<form>` + FormData。progressive enhancement | uncontrolled な `register`。DOM ref |
| Electron SPA との相性 | 高い。送信は任意の関数 | 低い。サーバー往復 (`lastResult`) が前提の API 設計 | 高い |
| controlled input | 標準 | `useInputControl` で補う | `Controller` で包む |
| 初期値との差分 | `isDefaultValue` (非永続) | `form.dirty` (FormData 比較) | `isDirty` (非永続) |
| ミックス状態の表現 | 既定値を `null`、入力後は文字列。`isDefaultValue` がそのまま判定になる | placeholder は表現できるが、FormData は文字列しか運べず `null` の初期値を保てない | TanStack Form と同様に表現可能 |
| schema 連携 | Standard Schema をそのまま渡す | `@conform-to/zod` (専用アダプター) | `@hookform/resolvers` (別パッケージ) |
| zod 4 | 対応 | 対応 (1.19 以降) | 対応 (resolvers 5.x) |
| shadcn/ui の公式ガイド | あり | なし | あり |

## 各候補の評価

### TanStack Form

採用。理由は [form ライブラリー選定](form-library.md) のとおりです。懸念は API 面の広さ (`form.Field` の render prop など) で、ダイアログ 1 つの規模では過剰にも見えますが、schema 連携とミックス状態の表現がもっとも素直でした。

### conform

不採用。強みは Remix / Next.js の server action と組み合わせた progressive enhancement で、サーバーのない Electron では活きません。値の正は FormData なので、ミックス状態 (初期値 `null`) を保てず、判定を別途持つ必要があります。

### React Hook Form

次点。実績が多く `isDirty` の意味も要件に合いますが、Base UI の `Input` は controlled で使うため全項目が `Controller` 経由になり、uncontrolled という本来の強みが消えます。schema 連携も別パッケージです。TanStack Form の採用が難航した場合の乗り換え先として記録します。

### ライブラリーを使わない案

`useReducer` + zod だけで書く案も検討しました。項目は 15 個の平坦な構造で、差分判定は純関数で済みます。ただし項目ごとのエラー・touched の管理を自前で持つことになり、v1.x で増える予定のフォーム (スマートプレイリストのルール編集、マーカー名など) で同じ実装を繰り返します。ライブラリーは表示層に留め、合成・差分・変換は純関数に切り出す方針で採用します。
