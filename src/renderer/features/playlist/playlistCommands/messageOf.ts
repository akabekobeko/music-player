/** Normalise a rejected invoke / error result into a message. */
export const messageOf = (reason: unknown): string =>
  reason instanceof Error ? reason.message : String(reason);
