import { expect, it } from "vitest";
import { shuffle } from "./shuffle";

it("returns a permutation of the input without mutating it", () => {
  const input = [1, 2, 3, 4, 5];
  const result = shuffle(input);
  expect(result).toHaveLength(5);
  expect([...result].sort()).toEqual([1, 2, 3, 4, 5]);
  expect(input).toEqual([1, 2, 3, 4, 5]);
});

it("is deterministic for an injected random source", () => {
  const sequence = [0.1, 0.5, 0.9, 0.3];
  let cursor = 0;
  const random = () => sequence[cursor++ % sequence.length] as number;
  expect(shuffle([1, 2, 3, 4, 5], random)).toEqual(
    shuffle(
      [1, 2, 3, 4, 5],
      (() => {
        cursor = 0;
        return random;
      })(),
    ),
  );
});

it("handles empty and single-element lists", () => {
  expect(shuffle([])).toEqual([]);
  expect(shuffle([42])).toEqual([42]);
});
