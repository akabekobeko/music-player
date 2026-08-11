import { warnedKeys } from "./warnedKeys";

/**
 * Clear the "already warned" set used by {@link import("./t").t}.
 *
 * Test-only escape hatch — production code should never need to call this.
 */
export const resetMissingKeyLog = (): void => {
  warnedKeys.clear();
};
