import { expect, it } from "vitest";
import { applyFullScreenState } from "./applyFullScreenState";

const fakeRoot = (): Pick<HTMLElement, "dataset"> => ({
  dataset: {} as DOMStringMap,
});

it("stamps data-fullscreen when entering full screen", () => {
  const root = fakeRoot();

  applyFullScreenState(true, root);

  expect(root.dataset.fullscreen).toBe("true");
});

it("removes data-fullscreen when leaving full screen", () => {
  const root = fakeRoot();
  root.dataset.fullscreen = "true";

  applyFullScreenState(false, root);

  expect("fullscreen" in root.dataset).toBe(false);
});
