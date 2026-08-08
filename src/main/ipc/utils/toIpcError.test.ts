import { expect, it } from "vitest";
import { toIpcError } from "./toIpcError";

it("returns name / message without code for a generic Error", () => {
  expect(toIpcError(new TypeError("boom"))).toEqual({
    name: "TypeError",
    message: "boom",
  });
});

it("preserves a Node-style string code", () => {
  const error = new Error("no such file") as Error & { code: string };
  error.code = "ENOENT";

  expect(toIpcError(error)).toEqual({
    name: "Error",
    code: "ENOENT",
    message: "no such file",
  });
});

it("ignores a non-string code property", () => {
  const error = new Error("numeric code") as Error & { code: number };
  error.code = 42;

  expect(toIpcError(error)).toEqual({
    name: "Error",
    message: "numeric code",
  });
});

it("drops `cause` from an Error", () => {
  const error = new Error("outer", { cause: new Error("inner") });

  expect(toIpcError(error)).not.toHaveProperty("cause");
});

it("falls back to Error when name is empty string", () => {
  const error = new Error("x");
  error.name = "";

  expect(toIpcError(error)).toEqual({
    name: "Error",
    message: "x",
  });
});

it("wraps a primitive (number) as Error", () => {
  expect(toIpcError(123)).toEqual({
    name: "Error",
    message: "123",
  });
});

it("wraps null as Error", () => {
  expect(toIpcError(null)).toEqual({
    name: "Error",
    message: "null",
  });
});
