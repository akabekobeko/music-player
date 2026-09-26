import type { z } from "zod";
import type {
  MusicBrainzClient,
  MusicBrainzRequestOptions,
} from "./MusicBrainzClient/MusicBrainzClient";
import type { MusicBrainzResult } from "./types";

/**
 * Issue a request through the client and validate the JSON body with a
 * schema (`docs/specs/v1.2/architecture/response-schema.md`).
 *
 * A body that is not JSON or does not match the schema is one failed
 * request (`MB_INVALID_RESPONSE`); the zod issue paths are logged so a
 * MusicBrainz-side change can be diagnosed without dumping the body.
 *
 * @param client - The shared client.
 * @param url - Absolute URL to fetch.
 * @param schema - Schema of the expected response.
 * @param options - Cancellation signal.
 * @returns The parsed value or the failure.
 */
export const requestJson = async <S extends z.ZodType>(
  client: MusicBrainzClient,
  url: string,
  schema: S,
  options: MusicBrainzRequestOptions = {},
): Promise<MusicBrainzResult<z.output<S>>> => {
  const response = await client.request(url, options);
  if (!response.ok) {
    return response;
  }

  let json: unknown;
  try {
    json = await response.value.json();
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.warn(`[musicbrainz] invalid JSON ${url}: ${message}`);
    return {
      ok: false,
      error: {
        code: "MB_INVALID_RESPONSE",
        message: `Invalid JSON: ${message}`,
      },
    };
  }

  const parsed = schema.safeParse(json);
  if (!parsed.success) {
    const paths = parsed.error.issues
      .map((issue) => issue.path.join(".") || "(root)")
      .join(", ");
    console.warn(`[musicbrainz] unexpected response shape ${url}: ${paths}`);
    return {
      ok: false,
      error: {
        code: "MB_INVALID_RESPONSE",
        message: `Unexpected response shape at ${paths}`,
      },
    };
  }

  return { ok: true, value: parsed.data };
};
