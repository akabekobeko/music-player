import { expect, it } from "vitest";
import { withCorsHeader } from "./withCorsHeader";

it("adds Access-Control-Allow-Origin and keeps status, headers, and body", async () => {
  const response = withCorsHeader(
    new Response("jpeg-bytes", {
      status: 206,
      headers: { "Content-Type": "image/jpeg" },
    }),
  );

  expect(response.status).toBe(206);
  expect(response.headers.get("Access-Control-Allow-Origin")).toBe("*");
  expect(response.headers.get("Content-Type")).toBe("image/jpeg");
  expect(await response.text()).toBe("jpeg-bytes");
});

it("keeps an error status", () => {
  const response = withCorsHeader(new Response("Forbidden", { status: 403 }));

  expect(response.status).toBe(403);
  expect(response.headers.get("Access-Control-Allow-Origin")).toBe("*");
});
