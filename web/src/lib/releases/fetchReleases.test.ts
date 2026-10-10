import { expect, it, vi } from "vitest";
import { fetchReleases, RELEASES_API_URL } from "./fetchReleases";

const jsonResponse = (body: unknown, status = 200): Response =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });

const valid = [
  {
    tag_name: "v1.3.0",
    name: "v1.3.0",
    html_url: "https://github.com/akabekobeko/parade/releases/tag/v1.3.0",
    published_at: "2026-10-04T00:23:58Z",
    draft: false,
    prerelease: false,
    assets: [],
  },
];

it("sends the token and a timeout signal, and parses a valid response", async () => {
  const fetchFn = vi.fn(async () => jsonResponse(valid));
  const releases = await fetchReleases({ token: "t0ken", fetchFn });
  expect(releases).toHaveLength(1);
  const [url, init] = fetchFn.mock.calls[0] as unknown as [string, RequestInit];
  expect(url).toBe(RELEASES_API_URL);
  expect((init.headers as Record<string, string>).Authorization).toBe(
    "Bearer t0ken",
  );
  expect(init.signal).toBeInstanceOf(AbortSignal);
});

it("retries after a server error and succeeds", async () => {
  const fetchFn = vi
    .fn()
    .mockResolvedValueOnce(jsonResponse({ message: "down" }, 503))
    .mockResolvedValueOnce(jsonResponse(valid));
  const releases = await fetchReleases({ fetchFn, delayMs: 0 });
  expect(releases).toHaveLength(1);
  expect(fetchFn).toHaveBeenCalledTimes(2);
});

it("gives up after the configured attempts on network errors", async () => {
  const fetchFn = vi.fn().mockRejectedValue(new Error("ECONNRESET"));
  await expect(
    fetchReleases({ fetchFn, attempts: 3, delayMs: 0 }),
  ).rejects.toThrow(/after 3 attempts: ECONNRESET/);
  expect(fetchFn).toHaveBeenCalledTimes(3);
});

it("does not retry a 4xx response", async () => {
  const fetchFn = vi.fn(async () => jsonResponse({ message: "nope" }, 404));
  await expect(fetchReleases({ fetchFn, delayMs: 0 })).rejects.toThrow(
    /responded 404/,
  );
  expect(fetchFn).toHaveBeenCalledTimes(1);
});

it("does not retry a response that fails validation", async () => {
  const fetchFn = vi.fn(async () => jsonResponse([{ tag_name: 1 }]));
  await expect(fetchReleases({ fetchFn, delayMs: 0 })).rejects.toThrow();
  expect(fetchFn).toHaveBeenCalledTimes(1);
});
