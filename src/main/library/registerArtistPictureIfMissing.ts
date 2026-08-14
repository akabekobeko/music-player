import type { DatabaseSync } from "node:sqlite";

/**
 * Register an artist's representative picture if the artist has none yet
 * (`docs/specs/v1.0/architecture/database.md`).
 *
 * First import wins — later imports never overwrite
 * (`docs/specs/v1.0/features/library.md`); explicit replacement from the UI
 * goes through `setArtistPicture` instead. Empty artist names are skipped.
 *
 * @param db - The open library connection.
 * @param artist - Artist name (the `musics.artist` value).
 * @param pictureId - Picture row to associate.
 */
export const registerArtistPictureIfMissing = (
  db: DatabaseSync,
  artist: string,
  pictureId: number,
): void => {
  if (artist === "") {
    return;
  }

  db.prepare(
    "INSERT INTO artist_pictures (artist, picture_id) VALUES (?, ?) ON CONFLICT(artist) DO NOTHING",
  ).run(artist, pictureId);
};
