import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { fetchFrontCover } from "./fetchFrontCover";
import {
  MusicBrainzClient,
  type MusicBrainzClientDeps,
} from "./MusicBrainzClient/MusicBrainzClient";

const RELEASE = "0f6a5c2e-1111-4a5b-9c2d-000000000001";
const GROUP = "2e3d1f4a-2222-4b6c-8d3e-000000000001";
const RELEASE_1200 = `https://coverartarchive.org/release/${RELEASE}/front-1200`;
const RELEASE_FULL = `https://coverartarchive.org/release/${RELEASE}/front`;
const GROUP_1200 = `https://coverartarchive.org/release-group/${GROUP}/front-1200`;

beforeEach(() => {
  vi.spyOn(console, "warn").mockImplementation(() => {});
  vi.spyOn(console, "info").mockImplementation(() => {});
});

afterEach(() => {
  vi.restoreAllMocks();
});

const image = (type = "image/jpeg"): Response =>
  new Response(new Uint8Array([1, 2, 3]), {
    status: 200,
    headers: { "Content-Type": type },
  });

const notFound = (): Response => new Response(null, { status: 404 });

/** Client whose fetch answers per URL and records the URLs requested. */
const clientFor = (
  responses: Readonly<Record<string, () => Response | Promise<Response>>>,
): { client: MusicBrainzClient; urls: string[] } => {
  const urls: string[] = [];
  const fetch: MusicBrainzClientDeps["fetch"] = async (url) => {
    urls.push(url);
    const respond = responses[url];
    if (respond === undefined) {
      throw new Error(`unexpected url ${url}`);
    }

    return respond();
  };
  return {
    client: new MusicBrainzClient("ua", {
      fetch,
      now: () => 0,
      sleep: async () => {},
    }),
    urls,
  };
};

it("returns the 1,200 px thumbnail when it exists", async () => {
  const { client, urls } = clientFor({ [RELEASE_1200]: image });

  const result = await fetchFrontCover(client, RELEASE, GROUP);

  expect(urls).toEqual([RELEASE_1200]);
  expect(result).toEqual({
    ok: true,
    value: { mimeType: "image/jpeg", data: new Uint8Array([1, 2, 3]) },
  });
});

it("falls back to the original, then the release group thumbnail, on 404", async () => {
  const { client, urls } = clientFor({
    [RELEASE_1200]: notFound,
    [RELEASE_FULL]: notFound,
    [GROUP_1200]: () => image("image/png; charset=binary"),
  });

  const result = await fetchFrontCover(client, RELEASE, GROUP);

  expect(urls).toEqual([RELEASE_1200, RELEASE_FULL, GROUP_1200]);
  expect(result).toMatchObject({ ok: true, value: { mimeType: "image/png" } });
});

it("returns null when every step is 404", async () => {
  const { client, urls } = clientFor({
    [RELEASE_1200]: notFound,
    [RELEASE_FULL]: notFound,
    [GROUP_1200]: notFound,
  });

  expect(await fetchFrontCover(client, RELEASE, GROUP)).toEqual({
    ok: true,
    value: null,
  });
  expect(urls).toHaveLength(3);
});

it("skips the release group step when the group id is unknown", async () => {
  const { client, urls } = clientFor({
    [RELEASE_1200]: notFound,
    [RELEASE_FULL]: notFound,
  });

  expect(await fetchFrontCover(client, RELEASE, undefined)).toEqual({
    ok: true,
    value: null,
  });
  expect(urls).toEqual([RELEASE_1200, RELEASE_FULL]);
});

it("skips a 2xx body with an unsupported Content-Type and tries the next step", async () => {
  const { client, urls } = clientFor({
    [RELEASE_1200]: () => image("text/html"),
    [RELEASE_FULL]: image,
  });

  expect(await fetchFrontCover(client, RELEASE, GROUP)).toMatchObject({
    ok: true,
    value: { mimeType: "image/jpeg" },
  });
  expect(urls).toEqual([RELEASE_1200, RELEASE_FULL]);
});

it("returns null when every step is unsupported or 404", async () => {
  const { client } = clientFor({
    [RELEASE_1200]: () => image("text/html"),
    [RELEASE_FULL]: notFound,
    [GROUP_1200]: () => image("application/json"),
  });

  expect(await fetchFrontCover(client, RELEASE, GROUP)).toEqual({
    ok: true,
    value: null,
  });
});

it("reports a cancel during the body download as MB_ABORTED", async () => {
  const controller = new AbortController();
  const { client } = clientFor({
    [RELEASE_1200]: () =>
      new Response(
        new ReadableStream({
          pull: () => {
            controller.abort();
            throw new DOMException("aborted", "AbortError");
          },
        }),
        { status: 200, headers: { "Content-Type": "image/jpeg" } },
      ),
  });

  expect(
    await fetchFrontCover(client, RELEASE, GROUP, {
      signal: controller.signal,
    }),
  ).toMatchObject({ ok: false, error: { code: "MB_ABORTED" } });
});

it("propagates errors other than 404", async () => {
  const { client, urls } = clientFor({
    [RELEASE_1200]: () => new Response(null, { status: 500 }),
  });

  expect(await fetchFrontCover(client, RELEASE, GROUP)).toMatchObject({
    ok: false,
    error: { code: "MB_HTTP_500" },
  });
  expect(urls).toEqual([RELEASE_1200]);
});

it("reports a network failure while fetching", async () => {
  const { client } = clientFor({
    [RELEASE_1200]: () => {
      throw new TypeError("fetch failed");
    },
  });

  expect(await fetchFrontCover(client, RELEASE, GROUP)).toMatchObject({
    ok: false,
    error: { code: "MB_NETWORK" },
  });
});
