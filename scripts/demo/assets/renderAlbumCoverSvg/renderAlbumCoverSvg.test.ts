import { expect, it } from "vitest";
import { buildDemoLibrary } from "../buildDemoLibrary/buildDemoLibrary.ts";
import { renderAlbumCoverSvg } from "./renderAlbumCoverSvg.ts";

it("renders the same cover for the same album", () => {
  const album = { artist: "Milo Ashgrove", title: "Modulations" };

  expect(renderAlbumCoverSvg(album)).toBe(renderAlbumCoverSvg(album));
});

it("renders different covers for different albums", () => {
  expect(
    renderAlbumCoverSvg({ artist: "Milo Ashgrove", title: "Modulations" }),
  ).not.toBe(renderAlbumCoverSvg({ artist: "Jane Doe", title: "Modulations" }));
});

it("escapes XML special characters in every cover of the library", () => {
  const albums = buildDemoLibrary().artists.flatMap((artist) => artist.albums);
  for (const album of albums) {
    const svg = renderAlbumCoverSvg({
      artist: album.artist,
      title: album.title,
    });
    expect(svg).not.toMatch(/&(?!amp;|lt;|gt;|quot;)/);
  }
});

it("prefixes element ids so covers can share a document", () => {
  const albums = buildDemoLibrary().artists.flatMap((artist) => artist.albums);
  for (const album of albums) {
    const svg = renderAlbumCoverSvg({
      artist: album.artist,
      title: album.title,
      id: "sheet7",
    });
    for (const [, id] of svg.matchAll(/ id="([^"]+)"/g)) {
      expect(id).toMatch(/^sheet7-/);
    }
  }
});
