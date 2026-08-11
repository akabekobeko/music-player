import type { AlbumFilter } from "@mp/ipc";
import { expect, it } from "vitest";
import { reduceAlbumFilter } from "./reduceAlbumFilter";

it("sets and clears the text field", () => {
  expect(reduceAlbumFilter({}, { type: "textChanged", text: "abc" })).toEqual({
    text: "abc",
  });
  expect(
    reduceAlbumFilter({ text: "abc" }, { type: "textChanged", text: "" }),
  ).toEqual({});
});

it("toggles genres on and off, dropping the empty array", () => {
  const withRock = reduceAlbumFilter(
    {},
    { type: "genreToggled", genre: "Rock" },
  );
  expect(withRock).toEqual({ genres: ["Rock"] });
  expect(
    reduceAlbumFilter(withRock, { type: "genreToggled", genre: "Jazz" }),
  ).toEqual({ genres: ["Rock", "Jazz"] });
  expect(
    reduceAlbumFilter(withRock, { type: "genreToggled", genre: "Rock" }),
  ).toEqual({});
});

it("toggles decades including the unknown-year marker", () => {
  const withUnknown = reduceAlbumFilter(
    {},
    { type: "decadeToggled", decade: null },
  );
  expect(withUnknown).toEqual({ decades: [null] });
  expect(
    reduceAlbumFilter(withUnknown, { type: "decadeToggled", decade: 1990 }),
  ).toEqual({ decades: [null, 1990] });
  expect(
    reduceAlbumFilter(withUnknown, { type: "decadeToggled", decade: null }),
  ).toEqual({});
});

it("keeps other kinds untouched when one kind changes", () => {
  const filter: AlbumFilter = { text: "a", genres: ["Rock"], decades: [2000] };
  expect(reduceAlbumFilter(filter, { type: "textChanged", text: "b" })).toEqual(
    { text: "b", genres: ["Rock"], decades: [2000] },
  );
});

it("clears every kind at once", () => {
  expect(
    reduceAlbumFilter(
      { text: "a", genres: ["Rock"], decades: [null] },
      { type: "cleared" },
    ),
  ).toEqual({});
});
