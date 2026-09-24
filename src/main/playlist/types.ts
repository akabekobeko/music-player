/** SQL fragment plus its bound parameters. */
export type SqlFragment = {
  readonly sql: string;
  readonly params: ReadonlyArray<string | number>;
};
