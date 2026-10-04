import { expect, it } from "vitest";
import { fetchCommonsImages } from "./fetchCommonsImages.ts";

const page = (title: string, license: string | undefined) => ({
  title,
  imageinfo: [
    {
      thumburl: `https://upload.example/${encodeURIComponent(title)}`,
      descriptionurl: `https://commons.example/${encodeURIComponent(title)}`,
      extmetadata: {
        ...(license === undefined
          ? {}
          : {
              License: { value: license },
              LicenseShortName: { value: license.toUpperCase() },
            }),
        Artist: { value: '<a href="//example">Jane &amp; Co</a>\n' },
      },
    },
  ],
});

it("returns license and author of each file as plain text", async () => {
  const images = await fetchCommonsImages(["File:A.jpg"], 960, async () =>
    Response.json({ query: { pages: { "1": page("File:A.jpg", "cc0") } } }),
  );

  expect(images.get("File:A.jpg")).toEqual({
    title: "File:A.jpg",
    imageUrl: "https://upload.example/File%3AA.jpg",
    pageUrl: "https://commons.example/File%3AA.jpg",
    license: "cc0",
    licenseName: "CC0",
    author: "Jane & Co",
  });
});

it("cleans up template prefixes and doubled placeholders in the author", async () => {
  const withAuthor = (author: string) => ({
    ...page("File:A.jpg", "cc0"),
    imageinfo: page("File:A.jpg", "cc0").imageinfo.map((info) => ({
      ...info,
      extmetadata: { ...info.extmetadata, Artist: { value: author } },
    })),
  });
  const authorOf = async (author: string) =>
    (
      await fetchCommonsImages(["File:A.jpg"], 960, async () =>
        Response.json({ query: { pages: { "1": withAuthor(author) } } }),
      )
    ).get("File:A.jpg")?.author;

  expect(await authorOf("Creator:Johann Haas")).toBe("Johann Haas");
  expect(
    await authorOf("<span>Unknown author</span><span>Unknown author</span>"),
  ).toBe("Unknown author");
});

it("reports an undeclared license as an empty string", async () => {
  const images = await fetchCommonsImages(["File:A.jpg"], 960, async () =>
    Response.json({ query: { pages: { "1": page("File:A.jpg", undefined) } } }),
  );

  expect(images.get("File:A.jpg")?.license).toBe("");
});

it("leaves out files that do not exist", async () => {
  const images = await fetchCommonsImages(["File:Missing.jpg"], 960, async () =>
    Response.json({
      query: { pages: { "-1": { title: "File:Missing.jpg" } } },
    }),
  );

  expect(images.size).toBe(0);
});

it("asks for the requested width and identifies itself", async () => {
  const requests: { url: string; userAgent: string | null }[] = [];
  await fetchCommonsImages(["File:A.jpg"], 640, async (input, init) => {
    requests.push({
      url: String(input),
      userAgent: new Headers(init?.headers).get("User-Agent"),
    });
    return Response.json({ query: { pages: {} } });
  });

  expect(requests).toHaveLength(1);
  expect(requests[0]?.url).toContain("iiurlwidth=640");
  expect(requests[0]?.userAgent).toContain("ParadeDemoAssets");
});

it("splits many titles into batches of 50", async () => {
  const titles = Array.from({ length: 120 }, (_, index) => `File:${index}.jpg`);
  let calls = 0;
  await fetchCommonsImages(titles, 960, async () => {
    calls++;
    return Response.json({ query: { pages: {} } });
  });

  expect(calls).toBe(3);
});

it("throws when the API responds with an error status", async () => {
  await expect(
    fetchCommonsImages(
      ["File:A.jpg"],
      960,
      async () => new Response("busy", { status: 503 }),
    ),
  ).rejects.toThrow("503");
});

it("keys a file by the title as passed in when the API normalises it", async () => {
  const images = await fetchCommonsImages(
    ["File:Old_Books.jpg"],
    960,
    async () =>
      Response.json({
        query: {
          normalized: [
            { from: "File:Old_Books.jpg", to: "File:Old Books.jpg" },
          ],
          pages: { "1": page("File:Old Books.jpg", "cc0") },
        },
      }),
  );

  expect(images.get("File:Old_Books.jpg")?.title).toBe("File:Old Books.jpg");
});
