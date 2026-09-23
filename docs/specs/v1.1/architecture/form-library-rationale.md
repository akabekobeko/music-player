# form ライブラリーの選定理由

[form ライブラリー選定](form-library.md) で TanStack Form + zod を選んだ理由です。他候補との比較は [候補の比較](form-library-candidates.md) にあります。

## TanStack Form を選ぶ理由

- **headless な store 型**: フォーム状態は TanStack Store に置かれ、コンポーネントは購読して描画する。v1.0 の「外部の状態は subscribe / getSnapshot」というメンタルモデル ([状態管理](../../v1.0/renderer/state-management.md)) に揃う。`<form>` の送信や FormData に依存しないため、Electron の SPA と IPC 送信に無理なく載る
- **`isDefaultValue`**: フィールドごと (とフォーム全体) に「現在値が既定値と等しいか」を持つ。要件 2 と 3 をこのフラグだけで満たせる ([複数選択の編集](../features/multi-edit.md) の変更判定)。なお `isDirty` は一度触ると戻らない永続フラグなので使わない
- **Standard Schema 対応**: zod 4 / valibot / ArkType の schema をアダプターなしでそのまま validator に渡せる。将来 zod を替えても form 側は変わらない
- **shadcn/ui が公式に案内**: [shadcn/ui の TanStack Form ガイド](https://ui.shadcn.com/docs/forms/tanstack-form) があり、`Field` 系コンポーネントとの組み合わせ方が整備されている
- **React 19 対応の純粋な ESM**: ネイティブ依存なし。devDependencies に置いて Vite でバンドルできる

## zod を選ぶ理由

- ユーザーの想定どおりで、最も普及した schema ライブラリー。エラーメッセージのカスタマイズと `z.infer` による型導出が揃う
- zod 4 は Standard Schema に準拠し、TanStack Form へ直接渡せる
- valibot はバンドルサイズが小さいが、Electron ではサイズが決め手にならない。`zod/mini` も同じ理由で使わず、通常の `zod` を使う
