import type { Artist } from "@mp/ipc";
import { expect, it } from "vitest";
import { artistInitialOf } from "./artistInitialOf";

const artist = (name: string, initial: string | null = null): Artist => ({
  name,
  musicCount: 1,
  picturePath: null,
  initial,
});

it("classifies by name when no initial is stored", () => {
  expect(artistInitialOf(artist("The Who"))).toBe("W");
  expect(artistInitialOf(artist("宇多田ヒカル"))).toBe("#");
});

it("prefers the stored initial over the name", () => {
  expect(artistInitialOf(artist("宇多田ヒカル", "U"))).toBe("U");
  expect(artistInitialOf(artist("The Who", "T"))).toBe("T");
});

it("ignores a stored value that is not a capital letter", () => {
  expect(artistInitialOf(artist("Adele", "#"))).toBe("A");
  expect(artistInitialOf(artist("Adele", "b"))).toBe("A");
  expect(artistInitialOf(artist("Adele", ""))).toBe("A");
});
