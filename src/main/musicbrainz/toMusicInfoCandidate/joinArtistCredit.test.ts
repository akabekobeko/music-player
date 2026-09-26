import { expect, it } from "vitest";
import { joinArtistCredit } from "./joinArtistCredit";

it("concatenates names with their join phrases", () => {
  expect(
    joinArtistCredit([
      { name: "Artist X", joinphrase: " feat. " },
      { name: "Artist Y", joinphrase: " & " },
      { name: "Artist Z" },
    ]),
  ).toBe("Artist X feat. Artist Y & Artist Z");
});

it("returns null for an absent or empty credit", () => {
  expect(joinArtistCredit(undefined)).toBeNull();
  expect(joinArtistCredit([])).toBeNull();
  expect(joinArtistCredit([{ name: "  " }])).toBeNull();
});
