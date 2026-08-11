import { expect, it } from "vitest";
import { createInitialPlayback } from "./createInitialPlayback";

it("starts loading with the given volume clamped", () => {
  expect(createInitialPlayback(2).volume).toBe(1);
  expect(createInitialPlayback(-1).volume).toBe(0);
  expect(createInitialPlayback(0.5).state).toBe("loading");
});
