import { expect, it } from "vitest";
import { MUSICBRAINZ_DEFAULT_RETRY_DELAY_MS } from "../constants";
import { retryDelayOf } from "./retryDelayOf";

it("converts a numeric Retry-After from seconds to ms", () => {
  expect(retryDelayOf("5")).toBe(5000);
  expect(retryDelayOf(" 1 ")).toBe(1000);
  expect(retryDelayOf("0")).toBe(0);
});

it("falls back to the default when the header is missing", () => {
  expect(retryDelayOf(null)).toBe(MUSICBRAINZ_DEFAULT_RETRY_DELAY_MS);
});

it("falls back to the default for an HTTP-date, empty or negative value", () => {
  expect(retryDelayOf("Wed, 21 Oct 2026 07:28:00 GMT")).toBe(
    MUSICBRAINZ_DEFAULT_RETRY_DELAY_MS,
  );
  expect(retryDelayOf("")).toBe(MUSICBRAINZ_DEFAULT_RETRY_DELAY_MS);
  expect(retryDelayOf("-3")).toBe(MUSICBRAINZ_DEFAULT_RETRY_DELAY_MS);
});
