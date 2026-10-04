import { execFileSync } from "node:child_process";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";

/** JPEG quality passed to sips, 0 to 100. */
const JPEG_QUALITY = 50;

/**
 * Rasterize an SVG document into a JPEG file with `sips` (macOS only, like
 * the `icons` script).
 *
 * @param svg - Standalone SVG document; its `width` / `height` decide the
 *   pixel size of the image.
 * @param outputPath - Destination path of the JPEG file. Missing parent
 *   directories are created.
 * @returns void.
 */
export const rasterizeSvgToJpeg = (svg: string, outputPath: string): void => {
  const workDir = mkdtempSync(path.join(os.tmpdir(), "parade-demo-"));
  try {
    const svgPath = path.join(workDir, "image.svg");
    writeFileSync(svgPath, svg);
    mkdirSync(path.dirname(outputPath), { recursive: true });
    execFileSync(
      "sips",
      [
        "-s",
        "format",
        "jpeg",
        "-s",
        "formatOptions",
        String(JPEG_QUALITY),
        svgPath,
        "--out",
        outputPath,
      ],
      { stdio: "ignore" },
    );
  } finally {
    rmSync(workDir, { recursive: true, force: true });
  }
};
