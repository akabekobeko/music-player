import {
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import path from "node:path";
import {
  COMMONS_USER_AGENT,
  type CommonsImage,
  fetchCommonsImages,
} from "./fetchCommonsImages.ts";
import { rasterizeSvgToJpeg } from "./rasterizeSvgToJpeg.ts";
import { renderSquarePhotoSvg } from "./renderSquarePhotoSvg.ts";
import { DEMO_ARTIST_PHOTOS } from "./seed/demoArtistPhotos.ts";
import type { DemoArtist } from "./types.ts";

/** Edge length of the stored artist pictures in pixels. */
const PHOTO_SIZE = 512;

/** Width requested from Commons; large enough to crop a sharp square. */
const SOURCE_WIDTH = 960;

/** The only license accepted for the demo data. */
const REQUIRED_LICENSE = "cc0";

/** Inputs of {@link fetchDemoArtistPictures}. */
type Params = {
  /** Artists of the demo library. */
  readonly artists: readonly DemoArtist[];
  /** Demo directory the pictures are written into. */
  readonly demoDir: string;
  /** Path of the credits document (`docs/demo/CREDITS.md`). */
  readonly creditsPath: string;
  /** Whether to download every picture again. */
  readonly force: boolean;
};

/**
 * Build the credits table row of one artist picture.
 *
 * The row names the source file, so it doubles as the record of which
 * photograph a stored picture was made from.
 *
 * @param artist - Artist name.
 * @param image - Commons file used as the picture.
 * @returns One Markdown table row.
 */
function buildCreditRow(artist: string, image: CommonsImage): string {
  const cell = (text: string): string => text.replace(/\|/g, "\\|");
  return `| ${cell(artist)} | [${cell(image.title.replace(/^File:/, ""))}](${image.pageUrl}) | ${cell(image.author || "-")} | ${cell(image.licenseName)} |`;
}

/**
 * Build the credits document listing every photograph with its source.
 *
 * @param rows - Artist names with the Commons file used as their picture.
 * @returns Markdown text of `docs/demo/CREDITS.md`.
 */
function buildCredits(
  rows: readonly { artist: string; image: CommonsImage }[],
): string {
  return [
    "# デモ用アーティスト画像のクレジット",
    "",
    "デモ用データの生成 (`pnpm demo:assets`) が出力するファイルです。直接編集しないでください。",
    "",
    "すべて [Wikimedia Commons](https://commons.wikimedia.org/) で [CC0 1.0](https://creativecommons.org/publicdomain/zero/1.0/) として公開されている画像です。ライセンスは取得時に Commons の API で確認しています。",
    "",
    "| アーティスト | 画像 | 作者 | ライセンス |",
    "| --- | --- | --- | --- |",
    ...rows.map(({ artist, image }) => buildCreditRow(artist, image)),
    "",
  ].join("\n");
}

/**
 * Fetch the artist pictures of the demo library into the demo directory
 * and update the credits document.
 *
 * Every picture is a photograph from Wikimedia Commons named in
 * `seed/demoArtistPhotos.ts`. The license of each file is read from the
 * Commons API and anything other than CC0 aborts the run, so a photograph
 * whose license changed is never downloaded. A stored picture is kept when
 * the credits already list the same source file for its artist and
 * downloaded again otherwise; `force` downloads everything again (needed
 * after changing only `align`). See `docs/demo/README.md`.
 *
 * @param params - See {@link Params}.
 * @returns void.
 */
export const fetchDemoArtistPictures = async ({
  artists,
  demoDir,
  creditsPath,
  force,
}: Params): Promise<void> => {
  // Rows of the previous run: a picture whose row is unchanged was made
  // from the same source file and does not need to be fetched again.
  const previousRows = new Set(
    existsSync(creditsPath)
      ? readFileSync(creditsPath, "utf-8").split("\n")
      : [],
  );

  const undefinedArtists = artists.filter(
    (artist) => DEMO_ARTIST_PHOTOS[artist.name] === undefined,
  );
  if (undefinedArtists.length > 0) {
    throw new Error(
      `No photograph is defined for: ${undefinedArtists
        .map((artist) => artist.name)
        .join(", ")}`,
    );
  }

  const images = await fetchCommonsImages(
    Object.values(DEMO_ARTIST_PHOTOS).map((photo) => photo.title),
    SOURCE_WIDTH,
  );
  const rows = artists.map((artist) => {
    const photo = DEMO_ARTIST_PHOTOS[artist.name];
    const image = photo && images.get(photo.title);
    if (photo === undefined || image === undefined) {
      throw new Error(`Photograph not found on Commons for ${artist.name}.`);
    }

    if (image.license !== REQUIRED_LICENSE) {
      throw new Error(
        `${image.title} is not CC0 (${image.license || "unknown"}).`,
      );
    }

    return {
      artist: artist.name,
      picturePath: artist.picturePath,
      photo,
      image,
    };
  });

  const picturesDir = path.join(demoDir, "images/artists");
  mkdirSync(picturesDir, { recursive: true });
  let downloaded = 0;
  for (const { artist, picturePath, photo, image } of rows) {
    const outputPath = path.join(demoDir, picturePath);
    if (
      !force &&
      existsSync(outputPath) &&
      previousRows.has(buildCreditRow(artist, image))
    ) {
      continue;
    }

    const response = await fetch(image.imageUrl, {
      headers: { "User-Agent": COMMONS_USER_AGENT },
    });
    if (!response.ok) {
      throw new Error(`Download failed (${response.status}): ${image.title}`);
    }

    // The picture is embedded as JPEG data, and Commons scales files of
    // other formats (PNG, SVG, GIF) into PNG.
    const contentType = response.headers.get("Content-Type") ?? "";
    if (!contentType.startsWith("image/jpeg")) {
      throw new Error(
        `${image.title} is not a JPEG (${contentType || "unknown type"}); pick a JPEG file.`,
      );
    }

    rasterizeSvgToJpeg(
      renderSquarePhotoSvg({
        jpeg: new Uint8Array(await response.arrayBuffer()),
        size: PHOTO_SIZE,
        align: photo.align ?? "middle",
      }),
      outputPath,
    );
    downloaded++;
  }

  const expected = new Set(rows.map((row) => path.basename(row.picturePath)));
  const stale = readdirSync(picturesDir).filter((name) => !expected.has(name));
  for (const name of stale) {
    rmSync(path.join(picturesDir, name));
  }

  writeFileSync(creditsPath, buildCredits(rows));
  console.log(
    `Artist pictures: ${rows.length} (downloaded ${downloaded}, removed ${stale.length})`,
  );
};
