# 曲情報の zod schema

[編集項目と validation](music-info-fields.md) の制約を zod で表現した schema と、そのテスト方針です。

## zod schema

```ts
// src/renderer/components/app/InfoDialog/MusicInfoDialog/musicInfoSchema.ts
const integerText = (min: number, max: number) =>
  z.string().refine((s) => s === "" || isIntegerInRange(s, min, max), { message: ... });

export const musicInfoSchema = z.object({
  title: z.string().nullable(),   // Required-ness for a single track is checked at form level
  artist: z.string().nullable(),
  ...,
  year: integerText(1, 9999).nullable(),
  track: integerText(0, 9999).nullable(),
  disc: integerText(1, 999).nullable(),
  bpm: integerText(1, 999).nullable(),
  rating: halfStepText(0, 5).nullable(),
});
```

- `nullable()` はミックス状態 (`null`) を通すためです。`null` は「未編集」なので制約の対象外です
- schema は検証のみに使い、transform は書きません (Standard Schema は変換結果をフォームへ書き戻さないため)。文字列から数値への変換は `toMusicTagPatch` が担います
- エラーメッセージは i18n キー (`musicInfo.error.required` / `musicInfo.error.integerRange` など) で引き、schema には値の範囲だけを持たせます

## テスト

`toMusicTagPatch` と `isIntegerInRange` / `halfStepText` は純関数として `*.test.ts` を並置します。「空文字は削除」「ミックスは patch に含めない」「rating の往復 (5 → 1.0 → 5)」を最低限のケースにします。
