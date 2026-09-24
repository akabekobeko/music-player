import { z } from "zod";

/** Row of the `SELECT id FROM ...` lookups. */
export const idRowSchema = z.object({ id: z.number().int() });
