import { readdirSync, readFileSync, rmSync } from "node:fs";
import path from "node:path";
import { DatabaseSync } from "node:sqlite";
import { smartPlaylistRulesSchema } from "../../../src/shared/schemas/smartPlaylistRulesSchema.ts";
import type { DemoLibrary } from "./types.ts";

/** Timestamp of the playlist rows. */
const PLAYLIST_TIMESTAMP = "2026-10-01T09:00:00.000Z";

/** Inputs of {@link writeDemoDatabase}. */
type Params = {
  /** Library to store. */
  readonly library: DemoLibrary;
  /** Destination path of the database file; replaced when it exists. */
  readonly dbPath: string;
  /** Directory of the app's migration scripts (`src/main/db/migrations`). */
  readonly migrationsDir: string;
};

/**
 * Write the demo library into a fresh SQLite database.
 *
 * The schema comes from the app's own migration scripts, applied the way
 * the app's migration runner does, so the file is exactly what the app
 * would have created. The scripts are taken from the directory in name
 * order because the app's ordered list is built from Vite raw imports and
 * cannot be loaded here; `writeDemoDatabase.test.ts` checks that both
 * agree. Paths are stored relative to the assets directory;
 * `pnpm demo` turns them into absolute paths after copying.
 *
 * @param params - See {@link Params}.
 * @returns void.
 */
export const writeDemoDatabase = ({
  library,
  dbPath,
  migrationsDir,
}: Params): void => {
  for (const suffix of ["", "-wal", "-shm", "-journal"]) {
    rmSync(`${dbPath}${suffix}`, { force: true });
  }

  const migrations = readdirSync(migrationsDir)
    .filter((name) => name.endsWith(".sql"))
    .sort();
  const db = new DatabaseSync(dbPath);
  try {
    // A single self-contained file: no WAL side files to commit.
    db.exec("PRAGMA journal_mode = DELETE");
    db.exec("PRAGMA foreign_keys = ON");
    for (const [index, name] of migrations.entries()) {
      db.exec("BEGIN");
      db.exec(readFileSync(path.join(migrationsDir, name), "utf-8"));
      db.exec(`PRAGMA user_version = ${index + 1}`);
      db.exec("COMMIT");
    }

    db.exec("BEGIN");
    const insertPicture = db.prepare(
      "INSERT INTO pictures (file_path) VALUES (?)",
    );
    const insertMusic = db.prepare(
      `INSERT INTO musics (
         file_path, audio_format, title, artist, album_artist, album, disc,
         track, year, genre, composer, lyricist, producer, conductor,
         publisher, duration_ms, bpm, rating, picture_id, added_at, updated_at
       ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    );
    const insertArtistPicture = db.prepare(
      "INSERT INTO artist_pictures (artist, picture_id) VALUES (?, ?)",
    );

    // `musics.id` per track, to resolve the playlist entries below.
    const musicIds = new Map<string, number | bigint>();
    for (const artist of library.artists) {
      for (const album of artist.albums) {
        const pictureId = insertPicture.run(album.coverPath).lastInsertRowid;
        for (const track of album.tracks) {
          const { lastInsertRowid } = insertMusic.run(
            track.filePath,
            track.audioFormat,
            track.title,
            track.artist,
            track.albumArtist,
            track.album,
            track.disc,
            track.track,
            track.year,
            track.genre,
            track.composer,
            track.lyricist,
            track.producer,
            track.conductor,
            track.publisher,
            track.durationMs,
            track.bpm,
            track.rating,
            pictureId,
            track.addedAt,
            track.addedAt,
          );
          musicIds.set(track.filePath, lastInsertRowid);
        }
      }

      insertArtistPicture.run(
        artist.name,
        insertPicture.run(artist.picturePath).lastInsertRowid,
      );
    }

    const insertPlaylist = db.prepare(
      "INSERT INTO playlists (name, sort_order, created_at, updated_at) VALUES (?, ?, ?, ?)",
    );
    const insertPlaylistMusic = db.prepare(
      "INSERT INTO playlist_musics (playlist_id, position, music_id) VALUES (?, ?, ?)",
    );
    for (const [order, playlist] of library.playlists.entries()) {
      const playlistId = insertPlaylist.run(
        playlist.name,
        order,
        PLAYLIST_TIMESTAMP,
        PLAYLIST_TIMESTAMP,
      ).lastInsertRowid;
      for (const [position, track] of playlist.tracks.entries()) {
        const musicId = musicIds.get(track.filePath);
        if (musicId === undefined) {
          throw new Error(
            `Playlist track is not in the library: ${track.filePath}`,
          );
        }

        insertPlaylistMusic.run(playlistId, position, musicId);
      }
    }

    const insertSmartPlaylist = db.prepare(
      "INSERT INTO smart_playlists (name, rules, sort_order, created_at, updated_at) VALUES (?, ?, ?, ?, ?)",
    );
    for (const [order, playlist] of library.smartPlaylists.entries()) {
      insertSmartPlaylist.run(
        playlist.name,
        // Parsed with the app's schema so a rule the app would reject fails
        // here instead of at demo time.
        JSON.stringify(smartPlaylistRulesSchema.parse(playlist.rules)),
        order,
        PLAYLIST_TIMESTAMP,
        PLAYLIST_TIMESTAMP,
      );
    }

    db.exec("COMMIT");
    db.exec("VACUUM");
  } finally {
    db.close();
  }
};
