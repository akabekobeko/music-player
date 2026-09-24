import { z } from "zod";

/** Row of the `SELECT id FROM ...` lookups. */
export const idRowSchema = z.object({
  /** The selected row's primary key. */
  id: z.number().int(),
});
