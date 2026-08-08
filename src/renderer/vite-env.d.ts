/// <reference types="vite/client" />

interface Window {
  /**
   * Bridge to the Main process exposed by the preload script.
   *
   * The value is supplied at runtime via `contextBridge.exposeInMainWorld`;
   * the type is sourced from `main/ipc/types.ts` so Renderer stays decoupled
   * from `electron` and from Main-only dependencies.
   */
  readonly mp: import("../main/ipc/types").MpBridge;
}

/**
 * Virtual module that re-exports every IPC contract type the Renderer needs.
 *
 * Renderer code imports these via `import type { ... } from "@mp/ipc"`
 * instead of reaching into `../../main/ipc/types`, so the cross-process
 * dependency on `src/main` is centralised in this declaration file.
 *
 * Type-only — `import type` is erased before Vite / the bundler runs, so no
 * real `@mp/ipc` module exists at runtime. Value-level imports from
 * `src/main/*` remain impossible for the Renderer.
 */
declare module "@mp/ipc" {
  export * from "../main/ipc/types";
}
