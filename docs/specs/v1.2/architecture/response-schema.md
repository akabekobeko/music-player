# 応答スキーマ

[MusicBrainz クライアント](musicbrainz-client.md) が受け取る応答 JSON を検証する zod スキーマの方針です。DB 行の検証 ([データベース](../../v1.0/architecture/database.md) の「クエリ結果の検証」) と同じく、`as` キャストではなくスキーマの `parse` を通し、型は `z.infer` で導出します ([コーディングルール](../../../coding-rules/README.md))。

各エンドポイントの応答は `src/main/musicbrainz/schemas/` の zod スキーマで `parse` し、`searchReleases` / `searchRecordings` / `lookupRelease` は `z.infer` で導出した型を返します。手書きの応答型は持ちません。

```ts
// src/main/musicbrainz/schemas/releaseSchema.ts (抜粋)
const artistCreditSchema = z.array(
  z.object({ name: z.string(), joinphrase: z.string().optional() }),
);

export const releaseSchema = z.object({
  id: z.string(),
  title: z.string(),
  date: z.string().optional(),
  "artist-credit": artistCreditSchema.optional(),
  media: z
    .array(
      z.object({
        position: z.number(),
        tracks: z.array(
          z.object({
            position: z.number(),
            title: z.string(),
            length: z.number().nullable().optional(),
            "artist-credit": artistCreditSchema.optional(),
            recording: z.object({ id: z.string(), title: z.string() }),
          }),
        ),
      }),
    )
    .optional(),
});

export type Release = z.infer<typeof releaseSchema>;
```

- **読む項目だけを宣言する**: [メタデータのマッピング](metadata-mapping.md) と [検索と照合](lookup-strategy.md) が参照する項目に限る (一覧は [MusicBrainz データと曲情報の対応表](musicbrainz-data-mapping.md))。宣言しない項目は zod の既定 (strip) で落ちるため、MusicBrainz 側の項目追加で壊れない
- **欠けやすい項目は `optional()` / `nullable()` にする**: MusicBrainz は `date` や `length`、relations などを持たないことが多い。必須にしてよいのは MBID (`id`) と `title` のような、なければ照合そのものが成り立たない項目だけ
- **制約は形だけ**: `score` の範囲やトラック数の下限などの採用条件はスキーマではなく [検索と照合](lookup-strategy.md) の判定に置く (DB 行の「制約は型契約に留める」と同じ)
- **不一致は 1 リクエストの失敗**: スキーマ不一致は `MB_INVALID_RESPONSE` として呼び出し側 (一括取得なら該当グループの曲) の失敗に集約し、他の曲の処理は止めない
- **フィクスチャーはスキーマを通す**: 保存した応答 JSON はテストで `releaseSchema.parse` してからマッピング関数へ渡す。スキーマとマッピングの両方を同じフィクスチャーで検証する
