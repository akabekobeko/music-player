/** Toggle `value` in `values` (append when absent, remove when present). */
export const toggle = <T>(values: readonly T[], value: T): T[] =>
  values.includes(value)
    ? values.filter((entry) => entry !== value)
    : [...values, value];
