import {
  existsSync,
  mkdirSync,
  readdirSync,
  rmSync,
  statSync,
  writeFileSync,
} from "node:fs";
import path from "node:path";
import { buildDemoLibrary } from "./demo/assets/buildDemoLibrary/buildDemoLibrary.ts";
import { DEMO_SETTINGS } from "./demo/assets/demoSettings.ts";
import { rasterizeSvgToJpeg } from "./demo/assets/rasterizeSvgToJpeg.ts";
import { renderAlbumCoverSvg } from "./demo/assets/renderAlbumCoverSvg/renderAlbumCoverSvg.ts";
import type { DemoLibrary } from "./demo/assets/types.ts";
import { writeDemoDatabase } from "./demo/assets/writeDemoDatabase.ts";
import { writeDemoTrackFile } from "./demo/assets/writeDemoTrackFile.ts";

/**
 * Render the album covers that are missing and delete the ones no album
 * uses any more.
 *
 * Existing files are kept unless `force` is set: a different macOS version
 * may encode the same artwork into different bytes, and rewriting every
 * cover would bloat the repository history for no visible change.
 *
 * @param library - The demo library.
 * @param assetsDir - Assets directory (`docs/demo/assets`).
 * @param force - Whether to render every cover again.
 */
function writeAlbumCovers(
  library: DemoLibrary,
  assetsDir: string,
  force: boolean,
): void {
  const albums = library.artists.flatMap((artist) => artist.albums);
  let rendered = 0;
  for (const album of albums) {
    const coverPath = path.join(assetsDir, album.coverPath);
    if (force || !existsSync(coverPath)) {
      rasterizeSvgToJpeg(
        renderAlbumCoverSvg({ artist: album.artist, title: album.title }),
        coverPath,
      );
      rendered++;
    }
  }

  const coversDir = path.join(assetsDir, "images/albums");
  const expected = new Set(
    albums.map((album) => path.basename(album.coverPath)),
  );
  const stale = readdirSync(coversDir).filter((name) => !expected.has(name));
  for (const name of stale) {
    rmSync(path.join(coversDir, name));
  }

  console.log(
    `Album covers: ${albums.length} (rendered ${rendered}, removed ${stale.length})`,
  );
}

/**
 * Check that every artist has its picture.
 *
 * The pictures are photographs fetched by `pnpm demo:photos`, not generated
 * here, so a missing one is an error to fix there.
 *
 * @param library - The demo library.
 * @param assetsDir - Assets directory (`docs/demo/assets`).
 */
function assertArtistPictures(library: DemoLibrary, assetsDir: string): void {
  const missing = library.artists.filter(
    (artist) => !existsSync(path.join(assetsDir, artist.picturePath)),
  );
  if (missing.length > 0) {
    throw new Error(
      `Artist pictures are missing; run "pnpm demo:photos" first: ${missing
        .map((artist) => artist.name)
        .join(", ")}`,
    );
  }

  console.log(`Artist pictures: ${library.artists.length}`);
}

/**
 * Create the audio file of the playable track when it is missing.
 *
 * @param library - The demo library.
 * @param assetsDir - Assets directory (`docs/demo/assets`).
 * @param force - Whether to create the file again.
 */
async function writePlayableTrack(
  library: DemoLibrary,
  assetsDir: string,
  force: boolean,
): Promise<void> {
  const track = library.playableTrack;
  const outputPath = path.join(assetsDir, track.filePath);
  if (!force && existsSync(outputPath)) {
    console.log(`Playable track: kept ${track.filePath}`);
    return;
  }

  const album = library.artists
    .flatMap((artist) => artist.albums)
    .find((candidate) => candidate.tracks.includes(track));
  if (album === undefined) {
    throw new Error("The playable track belongs to no album.");
  }

  // Only one audio file exists, so anything else in there is left over
  // from an earlier seed.
  rmSync(path.join(assetsDir, "musics"), { recursive: true, force: true });
  await writeDemoTrackFile({
    track,
    outputPath,
    coverPath: path.join(assetsDir, album.coverPath),
  });
  console.log(
    `Playable track: wrote ${track.filePath} (${statSync(outputPath).size} bytes)`,
  );
}

/**
 * Generate the demo assets in `docs/demo/assets` (`pnpm demo:assets`).
 *
 * Builds the library from the seed data in `scripts/demo/assets/seed`, then
 * writes the album covers, the playable track, `app.db` and
 * `settings.json`. Pass `--force` to recreate the covers and the track even
 * when they exist. macOS only (`sips`, `afconvert`). See
 * `docs/demo/README.md`.
 */
async function generateDemoAssets(): Promise<void> {
  const root = path.join(import.meta.dirname, "..");
  const assetsDir = path.join(root, "docs/demo/assets");
  const force = process.argv.includes("--force");
  const library = buildDemoLibrary();

  mkdirSync(path.join(assetsDir, "images/albums"), { recursive: true });
  writeAlbumCovers(library, assetsDir, force);
  assertArtistPictures(library, assetsDir);
  await writePlayableTrack(library, assetsDir, force);

  writeDemoDatabase({
    library,
    dbPath: path.join(assetsDir, "app.db"),
    migrationsDir: path.join(root, "src/main/db/migrations"),
  });
  const tracks = library.artists.flatMap((artist) =>
    artist.albums.flatMap((album) => album.tracks),
  );
  console.log(
    `Database: ${library.artists.length} artists, ${tracks.length} tracks`,
  );

  writeFileSync(
    path.join(assetsDir, "settings.json"),
    `${JSON.stringify(DEMO_SETTINGS, null, 2)}\n`,
  );
  console.log("Settings: written");
}

generateDemoAssets();
