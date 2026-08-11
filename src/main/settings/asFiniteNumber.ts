/** Narrow an unknown to a finite number, or return `undefined`. */
export const asFiniteNumber = (value: unknown): number | undefined =>
  typeof value === "number" && Number.isFinite(value) ? value : undefined;
