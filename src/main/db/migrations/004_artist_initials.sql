-- User-chosen initial (section letter) per display artist
-- (docs/specs/v1.0/features/artist-view.md). A row overrides the automatic
-- classification; no row means "auto" (the "Other" choice deletes the row).
-- Keyed like artist_pictures: the display artist (album_artist falling back
-- to artist). Rows of artists without any remaining track are GC'd together
-- with artist_pictures.
-- Applied files must never change; schema changes go into new numbered files.

CREATE TABLE artist_initials (
  artist  TEXT NOT NULL PRIMARY KEY,
  initial TEXT NOT NULL CHECK (initial GLOB '[A-Z]')
);
