import { expect, it } from "vitest";
import {
  applySelectionClick,
  EMPTY_SELECTION,
  type SelectionState,
} from "./applySelectionClick";

const ids = [10, 20, 30, 40, 50];

const state = (selected: number[], anchor: number | null): SelectionState => ({
  selectedIds: new Set(selected),
  anchorId: anchor,
});

it("plain click selects exactly the target and moves the anchor", () => {
  const next = applySelectionClick(state([10, 20], 10), ids, 30, {
    shift: false,
    meta: false,
  });
  expect([...next.selectedIds]).toEqual([30]);
  expect(next.anchorId).toBe(30);
});

it("meta click toggles membership and keeps the rest", () => {
  const added = applySelectionClick(state([10], 10), ids, 30, {
    shift: false,
    meta: true,
  });
  expect([...added.selectedIds].sort()).toEqual([10, 30]);

  const removed = applySelectionClick(added, ids, 10, {
    shift: false,
    meta: true,
  });
  expect([...removed.selectedIds]).toEqual([30]);
});

it("shift click selects the range from the anchor (either direction)", () => {
  const down = applySelectionClick(state([20], 20), ids, 40, {
    shift: true,
    meta: false,
  });
  expect([...down.selectedIds].sort()).toEqual([20, 30, 40]);
  expect(down.anchorId).toBe(20);

  const up = applySelectionClick(state([40], 40), ids, 20, {
    shift: true,
    meta: false,
  });
  expect([...up.selectedIds].sort()).toEqual([20, 30, 40]);
});

it("cmd+shift extends the existing selection with the range", () => {
  const next = applySelectionClick(state([10, 50], 40), ids, 30, {
    shift: true,
    meta: true,
  });
  expect([...next.selectedIds].sort()).toEqual([10, 30, 40, 50]);
});

it("shift without a usable anchor falls back to a single select", () => {
  const next = applySelectionClick(EMPTY_SELECTION, ids, 30, {
    shift: true,
    meta: false,
  });
  expect([...next.selectedIds]).toEqual([30]);
  expect(next.anchorId).toBe(30);
});
