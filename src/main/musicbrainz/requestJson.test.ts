import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { z } from "zod";
import {
  MusicBrainzClient,
  type MusicBrainzClientDeps,
} from "./MusicBrainzClient/MusicBrainzClient";
import { requestJson } from "./requestJson";

const URL = "https://musicbrainz.org/ws/2/release/x?fmt=json";
const schema = z.object({ id: z.string(), extra: z.number().optional() });

beforeEach(() => {
  vi.spyOn(console, "warn").mockImplementation(() => {});
  vi.spyOn(console, "info").mockImplementation(() => {});
});

afterEach(() => {
  vi.restoreAllMocks();
});

const clientWith = (fetch: MusicBrainzClientDeps["fetch"]): MusicBrainzClient =>
  new MusicBrainzClient("ua", { fetch, now: () => 0, sleep: async () => {} });

it("parses the body with the schema and strips unknown fields", async () => {
  const client = clientWith(async () =>
    Response.json({ id: "abc", extra: 1, unknown: true }),
  );

  expect(await requestJson(client, URL, schema)).toEqual({
    ok: true,
    value: { id: "abc", extra: 1 },
  });
});

it("reports a non-JSON body as MB_INVALID_RESPONSE", async () => {
  const client = clientWith(
    async () => new Response("<html>", { status: 200 }),
  );

  expect(await requestJson(client, URL, schema)).toMatchObject({
    ok: false,
    error: { code: "MB_INVALID_RESPONSE" },
  });
});

it("reports a schema mismatch as MB_INVALID_RESPONSE naming the path", async () => {
  const client = clientWith(async () => Response.json({ id: 1 }));

  const result = await requestJson(client, URL, schema);

  expect(result).toMatchObject({
    ok: false,
    error: { code: "MB_INVALID_RESPONSE" },
  });
  if (!result.ok) {
    expect(result.error.message).toContain("id");
  }
});

it("passes a transport failure through unchanged", async () => {
  const client = clientWith(async () => new Response(null, { status: 500 }));

  expect(await requestJson(client, URL, schema)).toMatchObject({
    ok: false,
    error: { code: "MB_HTTP_500" },
  });
});

it("reports a cancel during the body download as MB_ABORTED, not as invalid JSON", async () => {
  const controller = new AbortController();
  const client = clientWith(
    async () =>
      new Response(
        new ReadableStream({
          pull: () => {
            controller.abort();
            throw new DOMException("aborted", "AbortError");
          },
        }),
        { status: 200, headers: { "Content-Type": "application/json" } },
      ),
  );

  expect(
    await requestJson(client, URL, schema, { signal: controller.signal }),
  ).toMatchObject({ ok: false, error: { code: "MB_ABORTED" } });
});

it("reports a TimeoutError during the body download as MB_TIMEOUT", async () => {
  const client = clientWith(
    async () =>
      new Response(
        new ReadableStream({
          pull: () => {
            throw new DOMException("timed out", "TimeoutError");
          },
        }),
        { status: 200 },
      ),
  );

  expect(await requestJson(client, URL, schema)).toMatchObject({
    ok: false,
    error: { code: "MB_TIMEOUT" },
  });
});
