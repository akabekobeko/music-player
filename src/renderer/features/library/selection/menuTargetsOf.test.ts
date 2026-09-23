import { expect, it } from "vitest";
import { EMPTY_SELECTION, type SelectionState } from "./applySelectionClick";
import { menuTargetsOf } from "./menuTargetsOf";

type Row = { readonly id: number; readonly name: string };

const rows: readonly Row[] = [
  { id: 10, name: "a" },
  { id: 20, name: "b" },
  { id: 30, name: "c" },
  { id: 40, name: "d" },
];

const idOf = (row: Row): number => row.id;

const selected = (...ids: number[]): SelectionState => ({
  selectedIds: new Set(ids),
  anchorId: ids[0] ?? null,
});

it("targets the row alone when nothing is selected", () => {
  expect(menuTargetsOf(EMPTY_SELECTION, rows, idOf, rows[2] as Row)).toEqual([
    rows[2],
  ]);
});

it("targets the row alone when it is outside the selection", () => {
  expect(menuTargetsOf(selected(10, 20), rows, idOf, rows[3] as Row)).toEqual([
    rows[3],
  ]);
});

it("targets the whole selection in display order when the row is part of it", () => {
  expect(menuTargetsOf(selected(40, 10), rows, idOf, rows[3] as Row)).toEqual([
    rows[0],
    rows[3],
  ]);
});

it("targets the row alone when it is the only selected row", () => {
  expect(menuTargetsOf(selected(20), rows, idOf, rows[1] as Row)).toEqual([
    rows[1],
  ]);
});
