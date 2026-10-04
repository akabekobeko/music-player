/** Inputs of {@link renderSquarePhotoSvg}. */
type Params = {
  /** JPEG bytes of the source photograph. */
  readonly jpeg: Uint8Array;
  /** Edge length of the square in pixels. */
  readonly size: number;
  /**
   * Which part of the photograph to keep when it is not square: the start
   * (left or top), the middle or the end (right or bottom).
   */
  readonly align: "start" | "middle" | "end";
};

/** `preserveAspectRatio` keyword per alignment. */
const ALIGNMENTS = {
  start: "xMinYMin",
  middle: "xMidYMid",
  end: "xMaxYMax",
} as const;

/**
 * Wrap a photograph in an SVG document that crops it to a square.
 *
 * Rasterizing the document scales the photograph to cover the square and
 * cuts off what overflows, which `sips` cannot do on its own in one step.
 *
 * @param params - See {@link Params}.
 * @returns A standalone SVG document.
 */
export const renderSquarePhotoSvg = ({ jpeg, size, align }: Params): string =>
  `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}"><image width="${size}" height="${size}" preserveAspectRatio="${ALIGNMENTS[align]} slice" href="data:image/jpeg;base64,${Buffer.from(jpeg).toString("base64")}"/></svg>`;
