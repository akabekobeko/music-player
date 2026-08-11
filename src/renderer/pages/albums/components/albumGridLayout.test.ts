import { expect, it } from "vitest";
import {
  CARD_MIN_WIDTH,
  computeAlbumGridLayout,
  GRID_GAP,
} from "./albumGridLayout";

it("fits as many minimum-width columns as the width allows", () => {
  // 4 × 160 + 3 × 16 = 688 exactly.
  expect(computeAlbumGridLayout(688).columns).toBe(4);
  expect(computeAlbumGridLayout(687).columns).toBe(3);
});

it("distributes the remaining width across the columns", () => {
  const layout = computeAlbumGridLayout(700);
  expect(layout.columns).toBe(4);
  expect(layout.cardWidth).toBe(Math.floor((700 - 3 * GRID_GAP) / 4));
});

it("derives the row height from the card width", () => {
  const layout = computeAlbumGridLayout(700);
  expect(layout.rowHeight).toBeGreaterThan(layout.cardWidth);
});

it("falls back to one minimum-width column before measurement", () => {
  expect(computeAlbumGridLayout(0)).toEqual({
    columns: 1,
    cardWidth: CARD_MIN_WIDTH,
    rowHeight: CARD_MIN_WIDTH + 76,
  });
});

it("never returns zero columns for tiny widths", () => {
  expect(computeAlbumGridLayout(50).columns).toBe(1);
  expect(computeAlbumGridLayout(50).cardWidth).toBe(50);
});
