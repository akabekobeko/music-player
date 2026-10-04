import type { SeededRandom } from "../SeededRandom.ts";
import { COVER_SIZE } from "./drawCoverArt.ts";
import { escapeXml } from "./escapeXml.ts";
import { inkColorOf } from "./inkColorOf.ts";

/** A typeface for the title with the values needed to size the text. */
type Typeface = {
  /** CSS `font-family` list. */
  readonly family: string;
  /** CSS `font-weight`. */
  readonly weight: number;
  /** Average glyph width relative to the font size, for mixed case text. */
  readonly width: number;
  /** Whether the title may be set in capitals. */
  readonly capitals: boolean;
};

/** Typefaces for Latin titles; all ship with macOS. */
const TYPEFACES: readonly Typeface[] = [
  {
    family: "Helvetica Neue, Helvetica, Arial",
    weight: 700,
    width: 0.6,
    capitals: true,
  },
  { family: "Futura, Helvetica", weight: 500, width: 0.6, capitals: true },
  {
    family: "Avenir Next, Avenir, Helvetica",
    weight: 600,
    width: 0.58,
    capitals: true,
  },
  { family: "Gill Sans, Helvetica", weight: 600, width: 0.54, capitals: true },
  { family: "Georgia, serif", weight: 400, width: 0.56, capitals: false },
  { family: "Didot, Georgia, serif", weight: 400, width: 0.62, capitals: true },
  {
    family: "Baskerville, Georgia, serif",
    weight: 400,
    width: 0.5,
    capitals: false,
  },
  {
    family: "Courier New, Courier, monospace",
    weight: 700,
    width: 0.62,
    capitals: false,
  },
];

/** Typeface for titles with characters outside ASCII. */
const JAPANESE_TYPEFACE: Typeface = {
  family: "Hiragino Sans, sans-serif",
  weight: 600,
  width: 1.02,
  capitals: false,
};

/** Width of the text column in SVG units. */
const TEXT_WIDTH = 392;

/** Largest title font size in SVG units. */
const MAX_TITLE_SIZE = 46;

/** Inputs of {@link drawCoverText}. */
type Params = {
  /** Random source of the cover. */
  readonly rng: SeededRandom;
  /** Album title. */
  readonly title: string;
  /** Artist name. */
  readonly artist: string;
  /** Background color the artwork is based on, as `#rrggbb`. */
  readonly background: string;
  /**
   * Whether to put a solid label behind the text. Needed on busy artwork
   * where plain text would be unreadable.
   */
  readonly label: boolean;
  /**
   * Whether the text must sit at the top. Used when the lower half of the
   * artwork is too dark or too busy for plain text.
   */
  readonly top: boolean;
};

/**
 * Break a title into lines of limited length at word boundaries.
 *
 * @param text - Title to break.
 * @param limit - Preferred maximum number of characters per line.
 * @returns The lines; a single word longer than the limit stays unbroken.
 */
const wrap = (text: string, limit: number): string[] => {
  const lines: string[] = [];
  let line = "";
  for (const word of text.split(" ")) {
    if (line !== "" && line.length + 1 + word.length > limit) {
      lines.push(line);
      line = word;
    } else {
      line = line === "" ? word : `${line} ${word}`;
    }
  }

  if (line !== "") {
    lines.push(line);
  }

  return lines;
};

/**
 * Draw the album title and the artist name on a cover.
 *
 * SVG text cannot be measured here, so the font size is estimated from the
 * longest line and an average glyph width per typeface.
 *
 * @param params - See {@link Params}.
 * @returns SVG markup of the text and its optional label.
 */
export const drawCoverText = ({
  rng,
  title,
  artist,
  background,
  label,
  top: forceTop,
}: Params): string => {
  const japanese = /[^ -~]/.test(title + artist);
  const face = japanese ? JAPANESE_TYPEFACE : rng.pick(TYPEFACES);
  const capitals = face.capitals && rng.chance(0.6);
  const text = capitals ? title.toUpperCase() : title;
  const glyphWidth = face.width * (capitals ? 1.22 : 1);
  const lines = wrap(text, japanese ? 9 : 15);
  const longest = Math.max(...lines.map((line) => line.length));
  const size = Math.min(
    MAX_TITLE_SIZE,
    Math.floor(TEXT_WIDTH / (longest * glyphWidth)),
  );
  const artistSize = Math.min(
    20,
    Math.floor(TEXT_WIDTH / (artist.length * (japanese ? 1.02 : 0.62))),
  );
  const lineHeight = size * 1.12;
  const blockHeight = lines.length * lineHeight + artistSize * 1.9;
  const blockWidth = Math.max(
    longest * glyphWidth * size,
    artist.length * (japanese ? 1.02 : 0.62) * artistSize,
  );

  const padding = 22;
  const margin = 38;
  const top = rng.chance(0.4) || forceTop;
  const x = margin + (label ? padding : 0);
  const blockTop = top
    ? margin + (label ? padding : 0)
    : COVER_SIZE - margin - blockHeight - (label ? padding : 0);

  const ink = inkColorOf(background);
  const parts: string[] = [];
  if (label) {
    parts.push(
      `<rect x="${margin}" y="${Math.round(blockTop - padding)}" width="${Math.round(blockWidth + padding * 2)}" height="${Math.round(blockHeight + padding * 2)}" fill="${background}"/>`,
    );
  }

  for (const [index, line] of lines.entries()) {
    parts.push(
      `<text x="${x}" y="${Math.round(blockTop + size * 0.86 + index * lineHeight)}" font-family="${face.family}" font-weight="${face.weight}" font-size="${size}" fill="${ink}">${escapeXml(line)}</text>`,
    );
  }

  parts.push(
    `<text x="${x}" y="${Math.round(blockTop + lines.length * lineHeight + artistSize * 1.5)}" font-family="${japanese ? JAPANESE_TYPEFACE.family : "Helvetica Neue, Helvetica, Arial"}" font-weight="400" font-size="${artistSize}" fill="${ink}" opacity="0.85">${escapeXml(artist)}</text>`,
  );

  return parts.join("");
};
