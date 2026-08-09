import { expect, it } from "vitest";
import { formatTime } from "./formatTime";

it("formats minutes and seconds", () => {
  expect(formatTime(0)).toBe("0:00");
  expect(formatTime(62)).toBe("1:02");
  expect(formatTime(208)).toBe("3:28");
});

it("adds the hour part from one hour up", () => {
  expect(formatTime(3600)).toBe("1:00:00");
  expect(formatTime(3723)).toBe("1:02:03");
});

it("floors fractional seconds", () => {
  expect(formatTime(41.9)).toBe("0:41");
});

it("renders invalid values as 0:00", () => {
  expect(formatTime(Number.NaN)).toBe("0:00");
  expect(formatTime(-5)).toBe("0:00");
  expect(formatTime(Number.POSITIVE_INFINITY)).toBe("0:00");
});
