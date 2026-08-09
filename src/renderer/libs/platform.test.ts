import { expect, it } from "vitest";
import { detectPlatform } from "./platform";

it("classifies macOS user agents", () => {
  expect(
    detectPlatform(
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
    ),
  ).toBe("mac");
});

it("classifies Windows user agents", () => {
  expect(
    detectPlatform("Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/150"),
  ).toBe("windows");
});

it("classifies Linux user agents", () => {
  expect(detectPlatform("Mozilla/5.0 (X11; Linux x86_64) Chrome/150")).toBe(
    "linux",
  );
});

it("falls back to linux for unknown agents", () => {
  expect(detectPlatform("SomethingElse/1.0")).toBe("linux");
});
