import { expect, it } from "vitest";
import { SeededRandom } from "./SeededRandom.ts";

it("yields the same sequence for the same seed", () => {
  const first = new SeededRandom("seed");
  const second = new SeededRandom("seed");

  expect([first.next(), first.next(), first.next()]).toEqual([
    second.next(),
    second.next(),
    second.next(),
  ]);
});

it("yields different sequences for different seeds", () => {
  expect(new SeededRandom("a").next()).not.toBe(new SeededRandom("b").next());
});

it("returns values in [0, 1)", () => {
  const rng = new SeededRandom("range");
  for (let i = 0; i < 1000; i++) {
    const value = rng.next();
    expect(value).toBeGreaterThanOrEqual(0);
    expect(value).toBeLessThan(1);
  }
});

it("returns integers within the inclusive bounds", () => {
  const rng = new SeededRandom("int");
  const values = new Set<number>();
  for (let i = 0; i < 1000; i++) {
    values.add(rng.int(1, 3));
  }

  expect([...values].sort()).toEqual([1, 2, 3]);
});

it("throws when picking from an empty list", () => {
  expect(() => new SeededRandom("pick").pick([])).toThrow();
});

it("shuffles into a permutation without touching the input", () => {
  const items = [1, 2, 3, 4, 5];
  const shuffled = new SeededRandom("shuffle").shuffle(items);

  expect(items).toEqual([1, 2, 3, 4, 5]);
  expect([...shuffled].sort()).toEqual(items);
});
