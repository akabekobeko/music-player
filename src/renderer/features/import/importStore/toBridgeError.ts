import type { IpcError } from "@mp/ipc";

/** Normalise a rejected-promise reason into an {@link IpcError}. */
export const toBridgeError = (reason: unknown): IpcError =>
  reason instanceof Error
    ? { name: reason.name, message: reason.message }
    : { name: "Error", message: String(reason) };
