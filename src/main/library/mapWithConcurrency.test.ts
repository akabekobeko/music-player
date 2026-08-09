import { expect, it } from "vitest";
import { mapWithConcurrency } from "./mapWithConcurrency";

it("maps every item and keeps the input order", async () => {
  const results = await mapWithConcurrency([3, 1, 2], 2, async (n) => n * 10);
  expect(results).toEqual([30, 10, 20]);
});

it("never runs more than the limit concurrently", async () => {
  let running = 0;
  let peak = 0;
  await mapWithConcurrency(
    Array.from({ length: 20 }, (_, i) => i),
    8,
    async () => {
      running += 1;
      peak = Math.max(peak, running);
      await new Promise((resolve) => setTimeout(resolve, 1));
      running -= 1;
    },
  );
  expect(peak).toBeLessThanOrEqual(8);
});

it("handles an empty input", async () => {
  expect(await mapWithConcurrency([], 4, async () => 1)).toEqual([]);
});

it("passes the item index to the mapper", async () => {
  const results = await mapWithConcurrency(
    ["a", "b"],
    1,
    async (item, index) => `${item}${index}`,
  );
  expect(results).toEqual(["a0", "b1"]);
});
