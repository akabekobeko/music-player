-- v1 schema. See docs/specs/v1.0/architecture/database.md.
-- Applied files must never change; schema changes go into new numbered files.

CREATE TABLE musics (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  file_path    TEXT    NOT NULL UNIQUE,
  audio_format TEXT    NOT NULL,              -- mme AudioFormat
  title        TEXT    NOT NULL,              -- importer fills in file name when empty
  artist       TEXT    NOT NULL DEFAULT '',
  album_artist TEXT    NOT NULL DEFAULT '',
  album        TEXT    NOT NULL DEFAULT '',
  disc         INTEGER NOT NULL DEFAULT 1,
  track        INTEGER NOT NULL DEFAULT 0,
  year         INTEGER,                       -- unknown is NULL (avoid conflating with 0)
  genre        TEXT    NOT NULL DEFAULT '',
  composer     TEXT    NOT NULL DEFAULT '',
  duration_ms  INTEGER NOT NULL DEFAULT 0,    -- from mme; may be inaccurate for VBR MP3
  bpm          INTEGER,
  rating       REAL,                          -- mme normalised value [0,1]
  picture_id   INTEGER REFERENCES pictures(id),
  added_at     TEXT    NOT NULL,              -- ISO-8601
  updated_at   TEXT    NOT NULL
);

CREATE INDEX idx_musics_artist       ON musics(artist);
CREATE INDEX idx_musics_album_artist ON musics(album_artist);
CREATE INDEX idx_musics_album        ON musics(album);
CREATE INDEX idx_musics_genre        ON musics(genre);
CREATE INDEX idx_musics_year         ON musics(year);

CREATE TABLE pictures (
  id        INTEGER PRIMARY KEY AUTOINCREMENT,
  file_path TEXT NOT NULL UNIQUE               -- userData/images/<sha256>.<ext>
);

CREATE TABLE artist_pictures (
  artist     TEXT    NOT NULL PRIMARY KEY,
  picture_id INTEGER NOT NULL REFERENCES pictures(id)
);

CREATE TABLE playlists (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  name       TEXT    NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TEXT    NOT NULL,
  updated_at TEXT    NOT NULL
);

CREATE TABLE playlist_musics (
  playlist_id INTEGER NOT NULL REFERENCES playlists(id) ON DELETE CASCADE,
  position    INTEGER NOT NULL,
  music_id    INTEGER NOT NULL REFERENCES musics(id) ON DELETE CASCADE,
  PRIMARY KEY (playlist_id, position)
);

CREATE TABLE smart_playlists (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  name       TEXT    NOT NULL,
  rules      TEXT    NOT NULL,                 -- rule JSON (features/playlist.md)
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TEXT    NOT NULL,
  updated_at TEXT    NOT NULL
);
