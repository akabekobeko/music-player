import { expect, it } from "vitest";
import { albumKeyOf } from "./albumKeyOf";

it("joins the display artist and album with a NUL separator", () => {
  expect(albumKeyOf("Artist", "Album")).toBe("Artist\u0000Album");
});

it("keeps ('A B', 'C') and ('A', 'B C') distinct", () => {
  expect(albumKeyOf("A B", "C")).not.toBe(albumKeyOf("A", "B C"));
});
