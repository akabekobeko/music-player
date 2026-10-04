import type { SeededRandom } from "../SeededRandom.ts";

/** Edge length of the cover canvas in SVG units. */
export const COVER_SIZE = 512;

/** Names of the available artwork styles. */
export const COVER_STYLES = [
  "blobs",
  "rings",
  "blocks",
  "stripes",
  "horizon",
  "waves",
  "triangles",
  "dots",
  "venn",
  "sunburst",
  "arcs",
] as const;

/** Name of an artwork style. */
export type CoverStyle = (typeof COVER_STYLES)[number];

/** Styles calm enough to carry text without a backing label. */
export const CALM_STYLES: readonly CoverStyle[] = ["blobs", "horizon", "venn"];

/** Inputs shared by the style functions. */
type Params = {
  /** Random source of the cover. */
  readonly rng: SeededRandom;
  /** Five colors: two background tones, then three shape colors. */
  readonly colors: readonly string[];
  /**
   * Prefix for element ids, unique per cover so several covers can share
   * one SVG document.
   */
  readonly id: string;
};

/** Short alias of {@link COVER_SIZE} for the coordinate math below. */
const S = COVER_SIZE;

/**
 * @param colors - Palette of the cover.
 * @param index - Position in the palette; wraps around.
 * @returns The color at the position.
 */
const colorAt = (colors: readonly string[], index: number): string =>
  colors[index % colors.length] ?? "#000000";

/**
 * @param value - Coordinate or length.
 * @returns The value rounded to one decimal place for compact markup.
 */
const n = (value: number): string => String(Math.round(value * 10) / 10);

/** Soft blurred color blobs over a gradient. */
const blobs = ({ rng, colors, id }: Params): string => {
  const angle = rng.int(0, 359);
  const circles = Array.from({ length: rng.int(3, 5) }, (_, index) => {
    const radius = rng.int(90, 210);
    return `<circle cx="${rng.int(0, S)}" cy="${rng.int(0, S)}" r="${radius}" fill="${colorAt(colors, 2 + index)}" opacity="0.85" filter="url(#${id}-blur)"/>`;
  });
  return [
    `<defs><linearGradient id="${id}-bg" gradientTransform="rotate(${angle} 0.5 0.5)"><stop offset="0" stop-color="${colorAt(colors, 0)}"/><stop offset="1" stop-color="${colorAt(colors, 1)}"/></linearGradient><filter id="${id}-blur" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="42"/></filter></defs>`,
    `<rect width="${S}" height="${S}" fill="url(#${id}-bg)"/>`,
    ...circles,
  ].join("");
};

/** Concentric rings around an off-center point. */
const rings = ({ rng, colors }: Params): string => {
  const cx = rng.int(120, S - 120);
  const cy = rng.int(120, S - 120);
  const count = rng.int(6, 10);
  const step = 420 / count;
  const circles = Array.from({ length: count }, (_, index) => {
    const radius = 420 - index * step;
    return `<circle cx="${cx}" cy="${cy}" r="${n(radius)}" fill="${colorAt(colors, 1 + (index % 4))}"/>`;
  });
  return [
    `<rect width="${S}" height="${S}" fill="${colorAt(colors, 0)}"/>`,
    ...circles,
  ].join("");
};

/** Grid of colored tiles with quarter circles, discs and triangles. */
const blocks = ({ rng, colors }: Params): string => {
  const count = rng.int(3, 5);
  const cell = S / count;
  const shapes: string[] = [];
  for (let row = 0; row < count; row++) {
    for (let column = 0; column < count; column++) {
      const x = column * cell;
      const y = row * cell;
      const base = rng.int(0, 4);
      shapes.push(
        `<rect x="${n(x)}" y="${n(y)}" width="${n(cell + 0.5)}" height="${n(cell + 0.5)}" fill="${colorAt(colors, base)}"/>`,
      );
      const fill = colorAt(colors, base + rng.int(1, 4));
      const roll = rng.next();
      if (roll < 0.3) {
        // Quarter circle anchored to one of the four corners.
        const corner = rng.int(0, 3);
        const ax = corner % 2 === 0 ? x : x + cell;
        const ay = corner < 2 ? y : y + cell;
        const bx = corner % 2 === 0 ? x + cell : x;
        const by = corner < 2 ? y + cell : y;
        const sweep = corner === 0 || corner === 3 ? 0 : 1;
        shapes.push(
          `<path d="M${n(ax)} ${n(ay)} L${n(bx)} ${n(ay)} A${n(cell)} ${n(cell)} 0 0 ${sweep} ${n(ax)} ${n(by)} Z" fill="${fill}"/>`,
        );
      } else if (roll < 0.5) {
        shapes.push(
          `<circle cx="${n(x + cell / 2)}" cy="${n(y + cell / 2)}" r="${n(cell * 0.32)}" fill="${fill}"/>`,
        );
      } else if (roll < 0.65) {
        shapes.push(
          `<path d="M${n(x)} ${n(y + cell)} L${n(x + cell)} ${n(y + cell)} L${n(x + cell)} ${n(y)} Z" fill="${fill}"/>`,
        );
      }
    }
  }

  return shapes.join("");
};

/** Bands of varying width, optionally rotated. */
const stripes = ({ rng, colors }: Params): string => {
  const angle = rng.pick([0, 90, 30, 45, 60, 120, 135, 150]);
  const bands: string[] = [];
  let x = -S;
  let index = rng.int(0, 4);
  while (x < S * 2) {
    const width = rng.int(18, 96);
    bands.push(
      `<rect x="${x}" y="${-S}" width="${width + 1}" height="${S * 3}" fill="${colorAt(colors, index)}"/>`,
    );
    x += width;
    index += rng.int(1, 3);
  }

  return `<rect width="${S}" height="${S}" fill="${colorAt(colors, 0)}"/><g transform="rotate(${angle} ${S / 2} ${S / 2})">${bands.join("")}</g>`;
};

/** Sun over layered hills under a gradient sky. */
const horizon = ({ rng, colors, id }: Params): string => {
  const sunX = rng.int(110, S - 110);
  const sunY = rng.int(170, 270);
  const hills = Array.from({ length: rng.int(3, 4) }, (_, index) => {
    const base = 300 + index * 55;
    const amplitude = rng.int(14, 44);
    const phase = rng.range(0, Math.PI * 2);
    const waves = rng.range(0.8, 2.2);
    const points = Array.from({ length: 17 }, (_, step) => {
      const px = (S / 16) * step;
      const py =
        base + Math.sin(phase + (step / 16) * Math.PI * 2 * waves) * amplitude;
      return `L${n(px)} ${n(py)}`;
    });
    return `<path d="M0 ${S} ${points.join(" ")} L${S} ${S} Z" fill="${colorAt(colors, [1, 2, 0, 1][index] ?? 0)}" opacity="${index === 0 ? 0.75 : 1}"/>`;
  });
  return [
    `<defs><linearGradient id="${id}-sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${colorAt(colors, 0)}"/><stop offset="1" stop-color="${colorAt(colors, 3)}"/></linearGradient></defs>`,
    `<rect width="${S}" height="${S}" fill="url(#${id}-sky)"/>`,
    `<circle cx="${sunX}" cy="${sunY}" r="${rng.int(56, 104)}" fill="${colorAt(colors, 4)}"/>`,
    ...hills,
  ].join("");
};

/** Stacked wavy lines. */
const waves = ({ rng, colors }: Params): string => {
  const count = rng.int(12, 20);
  const gap = (S - 120) / count;
  const frequency = rng.range(1, 3);
  const lines = Array.from({ length: count }, (_, index) => {
    const base = 70 + index * gap;
    const amplitude = 8 + Math.sin((index / count) * Math.PI) * rng.int(14, 30);
    const phase = index * rng.range(0.25, 0.5);
    const points = Array.from({ length: 33 }, (_, step) => {
      const px = (S / 32) * step;
      const py =
        base +
        Math.sin(phase + (step / 32) * Math.PI * 2 * frequency) * amplitude;
      return `${step === 0 ? "M" : "L"}${n(px)} ${n(py)}`;
    });
    return `<path d="${points.join(" ")}" fill="none" stroke="${colorAt(colors, 2 + (index % 3))}" stroke-width="${rng.pick([2, 3, 4])}" stroke-linecap="round"/>`;
  });
  return [
    `<rect width="${S}" height="${S}" fill="${colorAt(colors, 0)}"/>`,
    ...lines,
  ].join("");
};

/** Grid of tiles split diagonally into two colors. */
const triangles = ({ rng, colors }: Params): string => {
  const count = rng.int(4, 6);
  const cell = S / count;
  const shapes: string[] = [];
  for (let row = 0; row < count; row++) {
    for (let column = 0; column < count; column++) {
      const x = column * cell;
      const y = row * cell;
      const first = rng.int(0, 4);
      const second = first + rng.int(1, 4);
      shapes.push(
        `<rect x="${n(x)}" y="${n(y)}" width="${n(cell + 0.5)}" height="${n(cell + 0.5)}" fill="${colorAt(colors, first)}"/>`,
      );
      shapes.push(
        rng.chance(0.5)
          ? `<path d="M${n(x)} ${n(y)} L${n(x + cell)} ${n(y)} L${n(x)} ${n(y + cell)} Z" fill="${colorAt(colors, second)}"/>`
          : `<path d="M${n(x + cell)} ${n(y)} L${n(x + cell)} ${n(y + cell)} L${n(x)} ${n(y + cell)} Z" fill="${colorAt(colors, second)}"/>`,
      );
    }
  }

  return shapes.join("");
};

/** Dot grid whose dots shrink with the distance from a focus point. */
const dots = ({ rng, colors }: Params): string => {
  const count = rng.int(9, 14);
  const cell = S / count;
  const focusX = rng.int(0, S);
  const focusY = rng.int(0, S);
  const fill = colorAt(colors, rng.int(2, 4));
  const circles: string[] = [];
  for (let row = 0; row < count; row++) {
    for (let column = 0; column < count; column++) {
      const cx = (column + 0.5) * cell;
      const cy = (row + 0.5) * cell;
      const distance = Math.hypot(cx - focusX, cy - focusY) / (S * 1.1);
      const radius = cell * 0.48 * Math.max(0.08, 1 - distance);
      circles.push(
        `<circle cx="${n(cx)}" cy="${n(cy)}" r="${n(radius)}" fill="${fill}"/>`,
      );
    }
  }

  return [
    `<rect width="${S}" height="${S}" fill="${colorAt(colors, 0)}"/>`,
    ...circles,
  ].join("");
};

/** Three large translucent overlapping discs. */
const venn = ({ rng, colors }: Params): string => {
  const circles = Array.from({ length: 3 }, (_, index) => {
    const angle = rng.range(0, Math.PI * 2);
    const distance = rng.int(40, 110);
    return `<circle cx="${n(S / 2 + Math.cos(angle) * distance)}" cy="${n(S / 2 - 30 + Math.sin(angle) * distance)}" r="${rng.int(120, 180)}" fill="${colorAt(colors, 2 + index)}" opacity="0.78"/>`;
  });
  return [
    `<rect width="${S}" height="${S}" fill="${colorAt(colors, rng.int(0, 1))}"/>`,
    ...circles,
  ].join("");
};

/** Alternating rays around a disc. */
const sunburst = ({ rng, colors }: Params): string => {
  const cx = rng.int(100, S - 100);
  const cy = rng.int(100, S - 100);
  const count = rng.int(8, 14) * 2;
  const rays = Array.from({ length: count }, (_, index) => {
    const from = (index / count) * Math.PI * 2;
    const to = ((index + 1) / count) * Math.PI * 2;
    return `<path d="M${cx} ${cy} L${n(cx + Math.cos(from) * 900)} ${n(cy + Math.sin(from) * 900)} L${n(cx + Math.cos(to) * 900)} ${n(cy + Math.sin(to) * 900)} Z" fill="${colorAt(colors, index % 2 === 0 ? 1 : 2)}"/>`;
  });
  return [
    `<rect width="${S}" height="${S}" fill="${colorAt(colors, 0)}"/>`,
    ...rays,
    `<circle cx="${cx}" cy="${cy}" r="${rng.int(40, 90)}" fill="${colorAt(colors, 4)}"/>`,
  ].join("");
};

/** Concentric arcs spreading from one corner. */
const arcs = ({ rng, colors }: Params): string => {
  const cx = rng.pick([0, S]);
  const cy = rng.pick([0, S]);
  const count = rng.int(5, 9);
  const step = (S * 1.25) / count;
  const circles = Array.from({ length: count }, (_, index) => {
    const radius = S * 1.25 - index * step;
    return `<circle cx="${cx}" cy="${cy}" r="${n(radius)}" fill="${colorAt(colors, index + 1)}"/>`;
  });
  return [
    `<rect width="${S}" height="${S}" fill="${colorAt(colors, 0)}"/>`,
    ...circles,
  ].join("");
};

/** Style functions by name. */
const STYLES: Readonly<Record<CoverStyle, (params: Params) => string>> = {
  blobs,
  rings,
  blocks,
  stripes,
  horizon,
  waves,
  triangles,
  dots,
  venn,
  sunburst,
  arcs,
};

/**
 * Draw the abstract artwork of a cover.
 *
 * @param style - Artwork style.
 * @param params - Random source, palette and id prefix.
 * @returns SVG markup filling the whole canvas, without the root element.
 */
export const drawCoverArt = (style: CoverStyle, params: Params): string =>
  STYLES[style](params);
