import { expect, it } from "vitest";
import { toFetchError } from "./toFetchError";

it("reports a cancelled request as MB_ABORTED regardless of the error", () => {
  const controller = new AbortController();
  controller.abort();
  expect(
    toFetchError(new DOMException("aborted", "AbortError"), controller.signal)
      .code,
  ).toBe("MB_ABORTED");
});

it("reports a TimeoutError as MB_TIMEOUT", () => {
  expect(
    toFetchError(new DOMException("timed out", "TimeoutError"), undefined),
  ).toEqual({ code: "MB_TIMEOUT", message: "timed out" });
});

it("reports any other rejection as MB_NETWORK with its message", () => {
  expect(toFetchError(new TypeError("fetch failed"), undefined)).toEqual({
    code: "MB_NETWORK",
    message: "fetch failed",
  });
  expect(toFetchError("boom", undefined)).toEqual({
    code: "MB_NETWORK",
    message: "boom",
  });
});

it("does not treat a live (not aborted) signal as a cancellation", () => {
  const controller = new AbortController();
  expect(
    toFetchError(new TypeError("fetch failed"), controller.signal).code,
  ).toBe("MB_NETWORK");
});
