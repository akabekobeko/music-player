import { expect, it } from "vitest";
import { en } from "./en";
import { ja } from "./ja";
import { t, tFor } from "./t";

it("every locale defines the same key set", () => {
  expect(Object.keys(ja).sort()).toEqual(Object.keys(en).sort());
});

it("looks up the dictionary of the given locale", () => {
  expect(t("en", "nav.download")).toBe("Download");
  expect(t("ja", "nav.download")).toBe("ダウンロード");
});

it("leaves a string without placeholders unchanged when params are given", () => {
  expect(t("en", "site.name", { unused: 1 })).toBe("Parade");
});

it("binds a locale with tFor", () => {
  expect(tFor("ja")("nav.home")).toBe("ホーム");
});
