import { expect, it } from "vitest";
import type { FetchMusicInfoRequest } from "../types";
import { validateFetchMusicInfoRequest } from "./validateFetchMusicInfoRequest";

it("accepts a non-empty list of distinct integer ids", () => {
  expect(validateFetchMusicInfoRequest({ musicIds: [1, 2, 3] })).toBeNull();
});

it("rejects a missing request or an empty list", () => {
  expect(validateFetchMusicInfoRequest(undefined)?.code).toBe(
    "INVALID_REQUEST",
  );
  expect(validateFetchMusicInfoRequest({ musicIds: [] })?.code).toBe(
    "INVALID_REQUEST",
  );
  expect(
    validateFetchMusicInfoRequest({} as unknown as FetchMusicInfoRequest)?.code,
  ).toBe("INVALID_REQUEST");
});

it("rejects non-integer and repeated ids", () => {
  expect(validateFetchMusicInfoRequest({ musicIds: [1.5] })?.message).toContain(
    "integers",
  );
  expect(
    validateFetchMusicInfoRequest({ musicIds: [1, 1] })?.message,
  ).toContain("repeat");
});
