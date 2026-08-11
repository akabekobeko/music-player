/** SQL fragment plus its bound parameters. */
export type SqlFragment = {
  readonly sql: string;
  readonly params: ReadonlyArray<string | number>;
};

/** Row shape shared by the two playlist tables' SELECTs. */
export type PlaylistRow = {
  id: number;
  name: string;
  sortOrder: number;
  rules?: string;
};
