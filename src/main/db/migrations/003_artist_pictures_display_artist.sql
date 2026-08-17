-- Re-key artist_pictures to the display artist (album_artist falling back
-- to artist). The artist list now groups by the display artist, so rows
-- keyed by a plain track artist that differs from every display artist can
-- no longer be reached.
-- 1. Register a representative track artwork for display artists that have
--    no association yet (mirrors the importer's first-found registration;
--    existing associations are never overwritten).
-- 2. Drop rows whose key matches no display artist.
-- Applied files must never change; schema changes go into new numbered files.

INSERT INTO artist_pictures (artist, picture_id)
SELECT display, picture_id
FROM (
  SELECT
    COALESCE(NULLIF(album_artist, ''), artist) AS display,
    picture_id
  FROM musics
  WHERE picture_id IS NOT NULL
)
WHERE display <> ''
GROUP BY display
ON CONFLICT(artist) DO NOTHING;

DELETE FROM artist_pictures
WHERE artist NOT IN (
  SELECT DISTINCT COALESCE(NULLIF(album_artist, ''), artist) FROM musics
);
