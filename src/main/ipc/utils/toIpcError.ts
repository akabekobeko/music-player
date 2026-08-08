import type { IpcError } from "../types";

/**
 * Normalize an arbitrary thrown value into an {@link IpcError}.
 *
 * `Error` instances do not survive Electron's structured clone (the prototype
 * chain and `cause` field are dropped), so every IPC handler funnels its
 * failures through this helper to produce a plain object the Renderer can
 * read.
 *
 * Branches:
 * - `Error` with a string `code` property (Node's `ENOENT`, mme's `MmeError`,
 *   DB error kinds, …) → keeps `name` / `code` / `message`; drops `cause`
 *   because Renderer cannot meaningfully consume the underlying chain.
 * - generic `Error` → keeps `name` / `message`; `code` is omitted.
 * - anything else (`null`, `123`, plain object, …) → wraps as
 *   `{ name: "Error", message: String(value) }`.
 *
 * @param value - The caught value (typically the argument of a `catch` clause).
 * @returns A serialisable error payload.
 */
export const toIpcError = (value: unknown): IpcError => {
  if (value instanceof Error) {
    const name = value.name === "" ? "Error" : value.name;
    const code = (value as { code?: unknown }).code;
    if (typeof code === "string" && code !== "") {
      return { name, code, message: value.message };
    }

    return { name, message: value.message };
  }

  return {
    name: "Error",
    message: String(value),
  };
};
