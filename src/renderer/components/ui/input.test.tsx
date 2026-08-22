import { expect, it } from "vitest";
import { isImeConfirmEnter } from "./input";

it("treats Enter during composition as an IME confirm", () => {
  expect(
    isImeConfirmEnter({ key: "Enter", nativeEvent: { isComposing: true } }),
  ).toBe(true);
});

it("treats keyCode 229 Enter as an IME confirm", () => {
  expect(
    isImeConfirmEnter({ key: "Enter", keyCode: 229, nativeEvent: {} }),
  ).toBe(true);
});

it("passes a plain Enter through", () => {
  expect(
    isImeConfirmEnter({
      key: "Enter",
      keyCode: 13,
      nativeEvent: { isComposing: false },
    }),
  ).toBe(false);
});

it("ignores non-Enter keys even while composing", () => {
  expect(
    isImeConfirmEnter({ key: "a", nativeEvent: { isComposing: true } }),
  ).toBe(false);
});
