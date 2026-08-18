import { existsSync } from "node:fs";
import path from "node:path";

/**
 * Resolve a possibly-stale path to itself or its nearest existing ancestor.
 *
 * Used to restore the import dialog's `defaultPath`: the persisted pick may
 * have been moved or deleted since the last launch, so climb the parent
 * chain until a path that still exists is found.
 *
 * @param target - Path persisted from a previous pick.
 * @returns `target` itself when it exists, else the closest existing
 *   ancestor directory. `null` when the climb ends at the filesystem root
 *   (`/`, or a drive letter on Windows) — opening there is pointless, so
 *   the dialog location is left to the OS instead.
 */
export const resolveExistingPath = (target: string): string | null => {
  let current = path.resolve(target);
  while (!existsSync(current)) {
    const parent = path.dirname(current);
    if (parent === current) {
      return null;
    }

    current = parent;
  }

  return path.dirname(current) === current ? null : current;
};
