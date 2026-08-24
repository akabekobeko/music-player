import { expect, it } from "vitest";
import { sortKeyWithoutArticle } from "./sortKeyWithoutArticle";

it("strips leading English articles from the sort key", () => {
  expect(sortKeyWithoutArticle("The Beatles")).toBe("beatles");
  expect(sortKeyWithoutArticle("A Perfect Circle")).toBe("perfect circle");
  expect(sortKeyWithoutArticle("An Horse")).toBe("horse");
  expect(sortKeyWithoutArticle("Thee Michelle Gun Elephant")).toBe(
    "michelle gun elephant",
  );
});

it("matches articles regardless of letter case", () => {
  expect(sortKeyWithoutArticle("THEE MICHELLE GUN ELEPHANT")).toBe(
    "michelle gun elephant",
  );
  expect(sortKeyWithoutArticle("THE WHO")).toBe("who");
  expect(sortKeyWithoutArticle("the who")).toBe("who");
  expect(sortKeyWithoutArticle("DIE ÄRZTE")).toBe("ärzte");
});

it("strips leading articles of other European languages", () => {
  expect(sortKeyWithoutArticle("Le Tigre")).toBe("tigre");
  expect(sortKeyWithoutArticle("La Roux")).toBe("roux");
  expect(sortKeyWithoutArticle("Les Savy Fav")).toBe("savy fav");
  expect(sortKeyWithoutArticle("Der Plan")).toBe("plan");
  expect(sortKeyWithoutArticle("Die Toten Hosen")).toBe("toten hosen");
  expect(sortKeyWithoutArticle("Das EFX")).toBe("efx");
  expect(sortKeyWithoutArticle("El Guincho")).toBe("guincho");
  expect(sortKeyWithoutArticle("Los Lobos")).toBe("lobos");
  expect(sortKeyWithoutArticle("Las Ketchup")).toBe("ketchup");
  expect(sortKeyWithoutArticle("Il Divo")).toBe("divo");
  expect(sortKeyWithoutArticle("Gli Atroci")).toBe("atroci");
  expect(sortKeyWithoutArticle("De Staat")).toBe("staat");
  expect(sortKeyWithoutArticle("Het Goede Doel")).toBe("goede doel");
  expect(sortKeyWithoutArticle("Os Mutantes")).toBe("mutantes");
  expect(sortKeyWithoutArticle("O Rappa")).toBe("rappa");
});

it("strips only the first article", () => {
  expect(sortKeyWithoutArticle("De La Soul")).toBe("la soul");
});

it("does not strip articles that are part of a word or elided", () => {
  expect(sortKeyWithoutArticle("Theatre of Tragedy")).toBe(
    "theatre of tragedy",
  );
  expect(sortKeyWithoutArticle("Adele")).toBe("adele");
  expect(sortKeyWithoutArticle("Lo-Fang")).toBe("lo-fang");
  expect(sortKeyWithoutArticle("L'Arc-en-Ciel")).toBe("l'arc-en-ciel");
  expect(sortKeyWithoutArticle("O.A.R.")).toBe("o.a.r.");
});

it("keeps English words that double as articles elsewhere", () => {
  expect(sortKeyWithoutArticle("I Am Kloot")).toBe("i am kloot");
  expect(sortKeyWithoutArticle("As I Lay Dying")).toBe("as i lay dying");
});
