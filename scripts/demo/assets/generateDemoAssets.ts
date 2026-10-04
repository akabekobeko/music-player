import {
  copyFileSync,
  existsSync,
  mkdirSync,
  readdirSync,
  rmSync,
  statSync,
  writeFileSync,
} from "node:fs";
import path from "node:path";
import { buildDemoLibrary } from "./buildDemoLibrary/buildDemoLibrary.ts";
import { fetchDemoArtistPictures } from "./fetchDemoArtistPictures.ts";
import { rasterizeSvgToJpeg } from "./rasterizeSvgToJpeg.ts";
import { renderAlbumCoverSvg } from "./renderAlbumCoverSvg/renderAlbumCoverSvg.ts";
import type { DemoLibrary } from "./types.ts";
import { writeDemoDatabase } from "./writeDemoDatabase.ts";
import { writeDemoTrackFile } from "./writeDemoTrackFile.ts";

/**
 * Version of the generated demo assets. It names the demo directory
 * (`demo-<version>` under userData), and `pnpm demo` generates the assets
 * again when no directory of this version exists.
 *
 * Increment it in the same change as anything that alters the generated
 * output: the DB schema (`src/main/db/migrations`), the seed
 * (`scripts/demo/assets/seed`), `docs/demo/CREDITS.md`,
 * `docs/demo/settings.json` or the generation logic under
 * `scripts/demo/assets`. See the coding rules
 * (`docs/coding-rules/README.md`).
 */
export const DEMO_ASSETS_VERSION = 1;

/** Inputs of {@link generateDemoAssets}. */
type Params = {
  /** Project root directory, where package.json lives. */
  readonly root: string;
  /** Demo directory the assets are generated into. */
  readonly demoDir: string;
  /**
   * Whether to recreate the pictures, the covers and the track even when
   * they exist.
   */
  readonly force: boolean;
  /**
   * Whether to write the credits of the fetched pictures to
   * `docs/demo/CREDITS.md`.
   */
  readonly updateCredits: boolean;
};

/**
 * Render the album covers that are missing and delete the ones no album
 * uses any more.
 *
 * Existing files are kept unless `force` is set, because rendering every
 * cover takes a while.
 *
 * @param library - The demo library.
 * @param demoDir - Demo directory.
 * @param force - Whether to render every cover again.
 */
function writeAlbumCovers(
  library: DemoLibrary,
  demoDir: string,
  force: boolean,
): void {
  const albums = library.artists.flatMap((artist) => artist.albums);
  let rendered = 0;
  for (const album of albums) {
    const coverPath = path.join(demoDir, album.coverPath);
    if (force || !existsSync(coverPath)) {
      rasterizeSvgToJpeg(
        renderAlbumCoverSvg({ artist: album.artist, title: album.title }),
        coverPath,
      );
      rendered++;
    }
  }

  const coversDir = path.join(demoDir, "images/albums");
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
 * Create the audio file of the playable track when it is missing.
 *
 * @param library - The demo library.
 * @param demoDir - Demo directory.
 * @param force - Whether to create the file again.
 */
async function writePlayableTrack(
  library: DemoLibrary,
  demoDir: string,
  force: boolean,
): Promise<void> {
  const track = library.playableTrack;
  const outputPath = path.join(demoDir, track.filePath);
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
  rmSync(path.join(demoDir, "musics"), { recursive: true, force: true });
  await writeDemoTrackFile({
    track,
    outputPath,
    coverPath: path.join(demoDir, album.coverPath),
  });
  console.log(
    `Playable track: wrote ${track.filePath} (${statSync(outputPath).size} bytes)`,
  );
}

/**
 * Generate the demo assets into the demo directory.
 *
 * Builds the library from the seed data in `scripts/demo/assets/seed`, then
 * writes the artist pictures, the album covers, the playable track and
 * `app.db`, and copies `docs/demo/settings.json`. Files that exist are
 * kept unless `force` is set;
 * `app.db` and `settings.json` are always replaced. Needs the network
 * (Wikimedia Commons) and macOS (`sips`, `afconvert`). See
 * `docs/demo/README.md`.
 *
 * @param params - See {@link Params}.
 * @returns void.
 */
export const generateDemoAssets = async ({
  root,
  demoDir,
  force,
  updateCredits,
}: Params): Promise<void> => {
  if (process.platform !== "darwin") {
    throw new Error(
      "The demo assets can only be generated on macOS (sips, afconvert).",
    );
  }

  const library = buildDemoLibrary();

  const credits = await fetchDemoArtistPictures({
    artists: library.artists,
    demoDir,
    force,
  });
  if (updateCredits) {
    writeFileSync(path.join(root, "docs/demo/CREDITS.md"), credits);
  }

  mkdirSync(path.join(demoDir, "images/albums"), { recursive: true });
  writeAlbumCovers(library, demoDir, force);
  await writePlayableTrack(library, demoDir, force);

  writeDemoDatabase({
    library,
    dbPath: path.join(demoDir, "app.db"),
    migrationsDir: path.join(root, "src/main/db/migrations"),
    demoDir,
  });
  const tracks = library.artists.flatMap((artist) =>
    artist.albums.flatMap((album) => album.tracks),
  );
  console.log(
    `Database: ${library.artists.length} artists, ${tracks.length} tracks`,
  );

  copyFileSync(
    path.join(root, "docs/demo/settings.json"),
    path.join(demoDir, "settings.json"),
  );
  console.log("Settings: copied");
};
