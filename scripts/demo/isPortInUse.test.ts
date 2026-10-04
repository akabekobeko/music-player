import net from "node:net";
import { expect, it } from "vitest";
import { isPortInUse } from "./isPortInUse.ts";

const listen = (): Promise<net.Server> =>
  new Promise((resolve) => {
    const server = net.createServer();
    server.listen(0, "localhost", () => resolve(server));
  });

const close = (server: net.Server): Promise<void> =>
  new Promise((resolve) => {
    server.close(() => resolve());
  });

const portOf = (server: net.Server): number => {
  const address = server.address();
  if (address === null || typeof address === "string") {
    throw new Error("The server has no port.");
  }

  return address.port;
};

it("reports a port something listens on as in use", async () => {
  const server = await listen();
  try {
    expect(await isPortInUse(portOf(server))).toBe(true);
  } finally {
    await close(server);
  }
});

it("reports a port nothing listens on as free", async () => {
  const server = await listen();
  const port = portOf(server);
  await close(server);

  expect(await isPortInUse(port)).toBe(false);
});
