import type { BrowserWindow } from "electron";
import { expect, it, vi } from "vitest";
import { IpcKeys } from "./ipcKeys";
import { pushFullScreenState } from "./pushFullScreenState";

const fakeWindow = (options: {
  fullScreen: boolean;
  destroyed?: boolean;
}): { window: BrowserWindow; send: ReturnType<typeof vi.fn> } => {
  const send = vi.fn();
  const window = {
    isDestroyed: () => options.destroyed ?? false,
    isFullScreen: () => options.fullScreen,
    webContents: { send },
  } as unknown as BrowserWindow;
  return { window, send };
};

it("pushes fullScreen: true when the window is in full screen", () => {
  const { window, send } = fakeWindow({ fullScreen: true });

  pushFullScreenState(window);

  expect(send).toHaveBeenCalledWith(IpcKeys.WindowFullScreenChanged, {
    fullScreen: true,
  });
});

it("pushes fullScreen: false when the window is not in full screen", () => {
  const { window, send } = fakeWindow({ fullScreen: false });

  pushFullScreenState(window);

  expect(send).toHaveBeenCalledWith(IpcKeys.WindowFullScreenChanged, {
    fullScreen: false,
  });
});

it("does nothing for a destroyed window", () => {
  const { window, send } = fakeWindow({ fullScreen: true, destroyed: true });

  pushFullScreenState(window);

  expect(send).not.toHaveBeenCalled();
});
