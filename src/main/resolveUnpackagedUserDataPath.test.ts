import path from "node:path";
import { expect, it } from "vitest";
import { resolveUnpackagedUserDataPath } from "./resolveUnpackagedUserDataPath";

const appData = path.resolve("app-data");

it("uses the productName directory when no override is given", () => {
  expect(
    resolveUnpackagedUserDataPath({
      appData,
      productName: "Parade",
      override: undefined,
    }),
  ).toBe(path.join(appData, "Parade"));
});

it("treats an empty override as unset", () => {
  expect(
    resolveUnpackagedUserDataPath({
      appData,
      productName: "Parade",
      override: "",
    }),
  ).toBe(path.join(appData, "Parade"));
});

it("uses the override directory when given", () => {
  const override = path.join(appData, "Parade", "demo");
  expect(
    resolveUnpackagedUserDataPath({
      appData,
      productName: "Parade",
      override,
    }),
  ).toBe(override);
});

it("resolves a relative override to an absolute path", () => {
  expect(
    resolveUnpackagedUserDataPath({
      appData,
      productName: "Parade",
      override: "demo-data",
    }),
  ).toBe(path.resolve("demo-data"));
});
