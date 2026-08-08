import { expect, it } from "vitest";
import { onGetVersions } from "./onGetVersions";

// The `electron` import inside the handler resolves to the Node-safe stub in
// `src/test/electron.mock.ts` via the vitest alias, so `app.getVersion()`
// reports "0.0.0-test".
const event = {} as Electron.IpcMainInvokeEvent;

it("returns an ok IpcResult with the runtime versions", async () => {
  const result = await onGetVersions(event);

  expect(result.ok).toBe(true);
  if (result.ok) {
    expect(result.value.app).toBe("0.0.0-test");
    expect(result.value.node).toBe(process.versions.node);
    expect(typeof result.value.electron).toBe("string");
    expect(typeof result.value.chrome).toBe("string");
  }
});
