import { SeededRandom } from "../SeededRandom.ts";
import { COVER_PALETTES } from "./coverPalettes.ts";
import {
  CALM_STYLES,
  COVER_SIZE,
  COVER_STYLES,
  drawCoverArt,
} from "./drawCoverArt.ts";
import { drawCoverText } from "./drawCoverText.ts";

/** Inputs of {@link renderAlbumCoverSvg}. */
type Params = {
  /** Artist name printed on the cover. */
  readonly artist: string;
  /** Album title printed on the cover. */
  readonly title: string;
  /**
   * Prefix for element ids. Pass a distinct value per cover when several
   * covers are embedded in one SVG document.
   */
  readonly id?: string;
};

/**
 * Render the cover of a fictional album as an SVG document.
 *
 * The artwork is abstract generative art (gradients and geometric shapes)
 * with the title and artist set in type. Palette, style and layout are
 * drawn from a random source seeded by the artist and title, so a cover
 * never changes unless its album is renamed.
 *
 * @param params - See {@link Params}.
 * @returns A standalone SVG document of {@link COVER_SIZE} square.
 */
export const renderAlbumCoverSvg = ({
  artist,
  title,
  id = "cover",
}: Params): string => {
  const rng = new SeededRandom(`cover:${artist}/${title}`);
  const colors = rng.shuffle(rng.pick(COVER_PALETTES));
  const style = rng.pick(COVER_STYLES);
  const art = drawCoverArt(style, { rng, colors, id });
  // A few covers stay purely graphic, without any text.
  const text = rng.chance(0.82)
    ? drawCoverText({
        rng,
        title,
        artist,
        background: colors[0] ?? "#000000",
        label: !CALM_STYLES.includes(style),
        // The hills of a horizon fill the lower half; keep text in the sky.
        top: style === "horizon",
      })
    : "";

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${COVER_SIZE}" height="${COVER_SIZE}" viewBox="0 0 ${COVER_SIZE} ${COVER_SIZE}">${art}${text}</svg>`;
};
