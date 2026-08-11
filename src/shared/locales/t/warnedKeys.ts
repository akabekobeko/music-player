/**
 * Tracks which keys have already been warned about so a missing translation
 * only surfaces once per process.
 *
 * Module-level state is intentional: the set is process-global because the
 * dictionaries themselves are. Tests reset it through
 * {@link import("./resetMissingKeyLog").resetMissingKeyLog}.
 */
export const warnedKeys = new Set<string>();
