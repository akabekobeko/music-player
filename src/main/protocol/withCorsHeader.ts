/**
 * Copy a response with `Access-Control-Allow-Origin: *` added.
 *
 * Both media schemes are cross-origin to the app (`file://` / dev server),
 * and the Renderer reads them in CORS mode: `<audio crossOrigin>` for
 * `media-stream://`, `fetch` for `media-file://`. Without the header the
 * response is opaque - silent audio, or an unreadable image body
 * (`docs/specs/v1.0/architecture/process-model.md`). Each handler validates
 * the path itself, so the wildcard does not widen what is served.
 *
 * @param response - Response to copy; its body is moved, not duplicated.
 * @returns The CORS-approved copy with the same status and headers.
 */
export const withCorsHeader = (response: Response): Response => {
  const headers = new Headers(response.headers);
  headers.set("Access-Control-Allow-Origin", "*");
  return new Response(response.body, {
    status: response.status,
    headers,
  });
};
