/** SQL fragment plus its bound parameters. */
export type SqlFragment = {
  /**
   * SQL text using `?` placeholders only, never interpolated values: one
   * WHERE condition from `buildConditionSql`, or the complete SELECT from
   * `buildSmartSql`.
   */
  readonly sql: string;
  /**
   * Values bound to the placeholders in `sql`, in placeholder order; empty
   * when the fragment has no placeholder.
   */
  readonly params: ReadonlyArray<string | number>;
};
