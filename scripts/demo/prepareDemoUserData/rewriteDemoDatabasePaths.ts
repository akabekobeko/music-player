import path from "node:path";
import { DatabaseSync } from "node:sqlite";

/** Tables whose `file_path` column holds a path relative to the assets. */
const PATH_TABLES = ["musics", "pictures"] as const;

/**
 * Turn the relative paths of a copied demo database into absolute paths.
 *
 * The committed `docs/demo/assets/app.db` stores `musics.file_path` and
 * `pictures.file_path` relative to the assets directory with `/` separators,
 * because the final location differs per machine. The app expects absolute
 * paths in the platform's notation, so every row is prefixed with the demo
 * directory.
 *
 * @param dbPath - Path of the copied `app.db` inside the demo directory.
 * @param demoDir - Absolute path of the demo directory the assets were
 *   copied into.
 * @returns void.
 */
export const rewriteDemoDatabasePaths = (
  dbPath: string,
  demoDir: string,
): void => {
  const db = new DatabaseSync(dbPath);
  try {
    db.exec("BEGIN");
    for (const table of PATH_TABLES) {
      db.prepare(
        `UPDATE ${table} SET file_path = ? || replace(file_path, '/', ?)`,
      ).run(demoDir + path.sep, path.sep);
    }

    db.exec("COMMIT");
  } finally {
    db.close();
  }
};
