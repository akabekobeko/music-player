import { expect, it } from "vitest";
import { reorderColumnIds } from "./reorderColumnIds";

const IDS: readonly string[] = ["artist", "album", "genre", "duration"];

it("moves the source after the target", () => {
  expect(
    reorderColumnIds({
      ids: IDS,
      sourceId: "artist",
      targetId: "genre",
      side: "after",
    }),
  ).toEqual(["album", "genre", "artist", "duration"]);
});

it("moves the source before the target", () => {
  expect(
    reorderColumnIds({
      ids: IDS,
      sourceId: "duration",
      targetId: "album",
      side: "before",
    }),
  ).toEqual(["artist", "duration", "album", "genre"]);
});

it("moves the source to either end", () => {
  expect(
    reorderColumnIds({
      ids: IDS,
      sourceId: "genre",
      targetId: "artist",
      side: "before",
    }),
  ).toEqual(["genre", "artist", "album", "duration"]);
  expect(
    reorderColumnIds({
      ids: IDS,
      sourceId: "artist",
      targetId: "duration",
      side: "after",
    }),
  ).toEqual(["album", "genre", "duration", "artist"]);
});

it("returns the same array when the source is dropped on itself", () => {
  expect(
    reorderColumnIds({
      ids: IDS,
      sourceId: "album",
      targetId: "album",
      side: "after",
    }),
  ).toBe(IDS);
});

it("returns the same array when the source already sits there", () => {
  expect(
    reorderColumnIds({
      ids: IDS,
      sourceId: "album",
      targetId: "genre",
      side: "before",
    }),
  ).toBe(IDS);
  expect(
    reorderColumnIds({
      ids: IDS,
      sourceId: "album",
      targetId: "artist",
      side: "after",
    }),
  ).toBe(IDS);
});

it("lists a repeated source once after the move", () => {
  expect(
    reorderColumnIds({
      ids: ["artist", "album", "artist"],
      sourceId: "artist",
      targetId: "album",
      side: "before",
    }),
  ).toEqual(["artist", "album"]);
});

it("returns the same array when either id is not listed", () => {
  expect(
    reorderColumnIds({
      ids: IDS,
      sourceId: "year",
      targetId: "album",
      side: "before",
    }),
  ).toBe(IDS);
  expect(
    reorderColumnIds({
      ids: IDS,
      sourceId: "album",
      targetId: "year",
      side: "before",
    }),
  ).toBe(IDS);
});
