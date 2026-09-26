import { afterEach, beforeEach, expect, it, vi } from "vitest";
import {
  MusicBrainzClient,
  type MusicBrainzClientDeps,
} from "./MusicBrainzClient";

const MB_URL = "https://musicbrainz.org/ws/2/release?query=x&fmt=json";
const CAA_URL = "https://coverartarchive.org/release/abc/front-1200";

/**
 * Virtual clock: `sleep` advances `now` instantly and records every wait,
 * and a fetch fake can advance it too to simulate response latency.
 */
type Clock = {
  /** Current virtual time in ms. */
  now: number;
  /** Every `sleep` duration, in call order. */
  readonly sleeps: number[];
};

let clock: Clock;

beforeEach(() => {
  clock = { now: 10_000, sleeps: [] };
  vi.spyOn(console, "warn").mockImplementation(() => {});
});

afterEach(() => {
  vi.restoreAllMocks();
});

type FetchFake = MusicBrainzClientDeps["fetch"];

const deps = (fetch: FetchFake): MusicBrainzClientDeps => ({
  fetch,
  now: () => clock.now,
  sleep: async (ms) => {
    clock.sleeps.push(ms);
    clock.now += ms;
  },
});

const okResponse = (): Response => new Response("{}", { status: 200 });

/** Fetch fake that records the virtual start time of each call. */
const recordingFetch = (
  latencyMs = 0,
  respond: () => Response = okResponse,
): { fetch: FetchFake; starts: number[]; calls: Parameters<FetchFake>[] } => {
  const starts: number[] = [];
  const calls: Parameters<FetchFake>[] = [];
  const fetch: FetchFake = async (url, init) => {
    starts.push(clock.now);
    calls.push([url, init]);
    clock.now += latencyMs;
    return respond();
  };
  return { fetch, starts, calls };
};

it("sends the User-Agent and Accept headers with every request", async () => {
  const { fetch, calls } = recordingFetch();
  const client = new MusicBrainzClient("Parade/1.2.0 ( contact )", deps(fetch));

  await client.request(MB_URL);
  await client.request(CAA_URL);

  expect(calls).toHaveLength(2);
  for (const [, init] of calls) {
    expect(init.headers["User-Agent"]).toBe("Parade/1.2.0 ( contact )");
    expect(init.headers.Accept).toBe("application/json");
    expect(init.signal).toBeInstanceOf(AbortSignal);
  }
});

it("resolves with the response for a 2xx status", async () => {
  const client = new MusicBrainzClient("ua", deps(recordingFetch().fetch));

  const result = await client.request(MB_URL);

  expect(result.ok).toBe(true);
  if (result.ok) {
    expect(result.value.status).toBe(200);
  }
});

it("starts the second musicbrainz.org request 1,000 ms after the first started", async () => {
  const { fetch, starts } = recordingFetch();
  const client = new MusicBrainzClient("ua", deps(fetch));

  await client.request(MB_URL);
  await client.request(MB_URL);

  expect(starts).toEqual([10_000, 11_000]);
  expect(clock.sleeps).toEqual([1000]);
});

it("waits only the remainder when the previous response took time", async () => {
  const { fetch, starts } = recordingFetch(800);
  const client = new MusicBrainzClient("ua", deps(fetch));

  await client.request(MB_URL);
  await client.request(MB_URL);

  expect(starts).toEqual([10_000, 11_000]);
  expect(clock.sleeps).toEqual([200]);
});

it("does not wait when the previous response already took longer than the interval", async () => {
  const { fetch, starts } = recordingFetch(1500);
  const client = new MusicBrainzClient("ua", deps(fetch));

  await client.request(MB_URL);
  await client.request(MB_URL);

  expect(starts).toEqual([10_000, 11_500]);
  expect(clock.sleeps).toEqual([]);
});

it("never waits for coverartarchive.org requests but keeps the musicbrainz.org spacing", async () => {
  const { fetch, starts } = recordingFetch();
  const client = new MusicBrainzClient("ua", deps(fetch));

  await client.request(MB_URL);
  await client.request(CAA_URL);
  await client.request(CAA_URL);
  await client.request(MB_URL);

  expect(starts).toEqual([10_000, 10_000, 10_000, 11_000]);
  expect(clock.sleeps).toEqual([1000]);
});

it("runs requests strictly one after another even when issued concurrently", async () => {
  let release: (() => void) | undefined;
  const order: string[] = [];
  const fetch: FetchFake = async (url) => {
    order.push(`start ${url}`);
    if (release === undefined) {
      await new Promise<void>((resolve) => {
        release = resolve;
      });
    }

    order.push(`end ${url}`);
    return okResponse();
  };
  const client = new MusicBrainzClient("ua", deps(fetch));

  const first = client.request(CAA_URL);
  const second = client.request(`${CAA_URL}?2`);
  await Promise.resolve();
  expect(order).toEqual([`start ${CAA_URL}`]);

  release?.();
  await Promise.all([first, second]);
  expect(order).toEqual([
    `start ${CAA_URL}`,
    `end ${CAA_URL}`,
    `start ${CAA_URL}?2`,
    `end ${CAA_URL}?2`,
  ]);
});

it("retries a 503 after the Retry-After seconds while holding the queue", async () => {
  const responses = [
    new Response(null, { status: 503, headers: { "Retry-After": "5" } }),
    okResponse(),
  ];
  const { fetch, starts } = recordingFetch(
    0,
    () => responses.shift() ?? okResponse(),
  );
  const client = new MusicBrainzClient("ua", deps(fetch));

  const result = await client.request(MB_URL);

  expect(result.ok).toBe(true);
  expect(clock.sleeps).toEqual([5000]);
  // The retry restarts the interval clock: 10,000 + 5,000 wait, no extra gap
  // because the wait already exceeded the minimum interval.
  expect(starts).toEqual([10_000, 15_000]);
});

it("waits the default delay when a 503 carries no Retry-After", async () => {
  const responses = [new Response(null, { status: 503 }), okResponse()];
  const { fetch } = recordingFetch(0, () => responses.shift() ?? okResponse());
  const client = new MusicBrainzClient("ua", deps(fetch));

  await client.request(MB_URL);

  expect(clock.sleeps).toEqual([2000]);
});

it("gives up with MB_THROTTLED after three 503 responses", async () => {
  const { fetch, calls } = recordingFetch(
    0,
    () => new Response(null, { status: 503 }),
  );
  const client = new MusicBrainzClient("ua", deps(fetch));

  const result = await client.request(MB_URL);

  expect(calls).toHaveLength(3);
  expect(clock.sleeps).toEqual([2000, 2000]);
  expect(result).toMatchObject({ ok: false, error: { code: "MB_THROTTLED" } });
});

it("reports any other non-2xx status as MB_HTTP_<status>", async () => {
  const { fetch } = recordingFetch(
    0,
    () => new Response(null, { status: 404, statusText: "Not Found" }),
  );
  const client = new MusicBrainzClient("ua", deps(fetch));

  const result = await client.request(CAA_URL);

  expect(result).toEqual({
    ok: false,
    error: { code: "MB_HTTP_404", message: "404 Not Found" },
  });
});

it("reports a rejected fetch as MB_NETWORK and a TimeoutError as MB_TIMEOUT", async () => {
  const network = new MusicBrainzClient(
    "ua",
    deps(async () => {
      throw new TypeError("fetch failed");
    }),
  );
  const timeout = new MusicBrainzClient(
    "ua",
    deps(async () => {
      throw new DOMException("timed out", "TimeoutError");
    }),
  );

  expect(await network.request(MB_URL)).toMatchObject({
    ok: false,
    error: { code: "MB_NETWORK", message: "fetch failed" },
  });
  expect(await timeout.request(MB_URL)).toMatchObject({
    ok: false,
    error: { code: "MB_TIMEOUT" },
  });
});

it("resolves an already-cancelled request with MB_ABORTED without fetching", async () => {
  const { fetch, calls } = recordingFetch();
  const client = new MusicBrainzClient("ua", deps(fetch));
  const controller = new AbortController();
  controller.abort();

  const result = await client.request(MB_URL, { signal: controller.signal });

  expect(calls).toHaveLength(0);
  expect(result).toMatchObject({ ok: false, error: { code: "MB_ABORTED" } });
});

it("keeps serving the queue after a failed request", async () => {
  const responses = [new Response(null, { status: 500 }), okResponse()];
  const { fetch } = recordingFetch(0, () => responses.shift() ?? okResponse());
  const client = new MusicBrainzClient("ua", deps(fetch));

  const first = await client.request(MB_URL);
  const second = await client.request(MB_URL);

  expect(first.ok).toBe(false);
  expect(second.ok).toBe(true);
});
