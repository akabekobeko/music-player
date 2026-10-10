import { expect, it } from "vitest";
import { formatSizeMB } from "./formatSize";

it("formats bytes as decimal megabytes with one decimal", () => {
  expect(formatSizeMB(129331228)).toBe("129.3 MB");
  expect(formatSizeMB(0)).toBe("0.0 MB");
  expect(formatSizeMB(1_960_000)).toBe("2.0 MB");
});
