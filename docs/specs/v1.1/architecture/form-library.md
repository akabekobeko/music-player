# form ライブラリー選定

曲情報ダイアログの編集状態と validation を管理するライブラリーの選定です。候補の比較は [候補の比較](form-library-candidates.md) にまとめています。

## 結論

**TanStack Form (`@tanstack/react-form` 1.x) + zod (`zod` 4.x)** を採用します。

## 要件

1. **Electron の SPA で完結する**: サーバーも `<form>` の送信もない。値は Renderer の state として持ち、送信先は IPC
2. **初期状態との差分で活性化する適用ボタン**: 「編集して元の値に戻したら非活性」を素直に表現できること
3. **ミックス状態** ([複数選択の編集](../features/multi-edit.md)): 「未入力 + placeholder」という特別な初期値を持ち、空欄にした編集と区別できること
4. **controlled な入力**: UI は shadcn/ui (Base UI core) の `Input` で、`value` / `onChange` で扱う
5. **schema 駆動の validation**: 項目ごとの制約を型つき schema で一元定義し、エラーを項目の下に出す
6. v1.0 の [技術選定](../../v1.0/architecture/tech-stack.md) の方針 (devDependencies + Vite バンドル、ネイティブモジュールなし、ESM) に合うこと

選定理由は [選定理由](form-library-rationale.md) を参照してください。

## 注意点

- Standard Schema 経由の validation は transform / coerce の結果をフォーム値へ書き戻さない。schema は検証のみに使い、文字列から保存値への変換は純関数 (`toMusicTagPatch`) で行う ([編集項目と validation](../features/music-info-fields.md))
- フォーム値の合成 (`mergeMusics`) と差分抽出はライブラリー非依存の純関数として切り出し、テストする。ライブラリーはこれらの結果を表示・購読する層に留める
