import { expect, it } from "vitest";
import { dictionaries } from "./dictionaries";

it("every locale defines the same key set", () => {
  const enKeys = Object.keys(dictionaries.en).sort();
  const jaKeys = Object.keys(dictionaries.ja).sort();
  expect(jaKeys).toEqual(enKeys);
});
