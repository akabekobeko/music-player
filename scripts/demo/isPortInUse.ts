import net from "node:net";

/** Milliseconds to wait for a connection before treating the port as free. */
const TIMEOUT_MS = 1000;

/**
 * Check whether something is listening on a local TCP port.
 *
 * @param port - Port number on localhost.
 * @returns `true` when a connection is accepted, `false` when it is refused
 *   or does not answer in time.
 */
export const isPortInUse = (port: number): Promise<boolean> =>
  new Promise((resolve) => {
    const socket = net.connect({ port, host: "localhost" });
    const finish = (inUse: boolean): void => {
      socket.destroy();
      resolve(inUse);
    };
    socket.setTimeout(TIMEOUT_MS, () => finish(false));
    socket.once("connect", () => finish(true));
    socket.once("error", () => finish(false));
  });
