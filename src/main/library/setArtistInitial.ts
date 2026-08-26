import type { DatabaseSync } from "node:sqlite";
import { deleteOrphanedArtistInitials } from "./deleteOrphanedArtistInitials";

/**
 * Set or clear an artist's user-chosen initial (the section letter of the
 * artist list, `docs/specs/v1.0/features/artist-view.md`).
 *
 * A capital letter A–Z is stored in `artist_initials` and takes precedence
 * over the automatic classification; `null` ("Other") deletes the row so
 * the classification falls back to the name. Rows of artists without any
 * remaining track are GC'd in the same transaction, so a choice for a
 * vanished artist never survives.
 *
 * @param db - The open library connection.
 * @param artist - Display-artist name (the artist list's entry); must not be empty.
 * @param initial - Capital letter A–Z, or `null` to clear the choice.
 */
export const setArtistInitial = (
  db: DatabaseSync,
  artist: string,
  initial: string | null,
): void => {
  if (artist === "") {
    throw new Error("Cannot set an initial for an empty artist name.");
  }

  if (initial !== null && !/^[A-Z]$/.test(initial)) {
    throw new Error(`Invalid initial: ${initial}`);
  }

  db.exec("BEGIN");
  try {
    if (initial === null) {
      db.prepare("DELETE FROM artist_initials WHERE artist = ?").run(artist);
    } else {
      db.prepare(
        "INSERT INTO artist_initials (artist, initial) VALUES (?, ?) ON CONFLICT(artist) DO UPDATE SET initial = excluded.initial",
      ).run(artist, initial);
    }

    deleteOrphanedArtistInitials(db);
    db.exec("COMMIT");
  } catch (error) {
    db.exec("ROLLBACK");
    throw error;
  }
};
