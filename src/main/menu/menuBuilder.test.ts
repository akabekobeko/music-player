import type { MenuItemConstructorOptions } from "electron";
import { expect, it } from "vitest";
import type { MenuAction } from "../ipc/types";
import { buildMenuTemplate } from "./menuBuilder";

const build = (
  platform: NodeJS.Platform,
  locale: "en" | "ja" = "en",
  onAction: (action: MenuAction) => void = () => {},
) =>
  buildMenuTemplate({
    platform,
    locale,
    appName: "Music Player",
    state: { isPlaying: false },
    onAction,
  });

/** Depth-first search for an item by label. */
const findItem = (
  items: readonly MenuItemConstructorOptions[],
  label: string,
): MenuItemConstructorOptions | undefined => {
  for (const item of items) {
    if (item.label === label) {
      return item;
    }

    const found = Array.isArray(item.submenu)
      ? findItem(item.submenu, label)
      : undefined;
    if (found !== undefined) {
      return found;
    }
  }

  return undefined;
};

/** Find an item by label and invoke its click handler (asserting both). */
const clickItem = (
  items: readonly MenuItemConstructorOptions[],
  label: string,
): void => {
  const item = findItem(items, label);
  expect(item?.click).toBeTypeOf("function");
  (item as { readonly click: () => void }).click();
};

it("places the app menu first on macOS only", () => {
  expect(build("darwin")[0]?.label).toBe("Music Player");
  expect(build("win32")[0]?.label).toBe("File");
});

it("forwards Import… clicks as the import action", () => {
  const actions: MenuAction[] = [];
  const template = build("darwin", "en", (action) => actions.push(action));
  expect(findItem(template, "Import…")?.accelerator).toBe("CmdOrCtrl+O");

  clickItem(template, "Import…");
  expect(actions).toEqual(["import"]);
});

it("routes settings and about through menu actions", () => {
  const actions: MenuAction[] = [];
  const template = build("win32", "en", (action) => actions.push(action));
  clickItem(template, "Settings…");
  clickItem(template, "About Music Player");
  expect(actions).toEqual(["openSettings", "showAbout"]);
});

it("puts about into the app menu on macOS and Help elsewhere", () => {
  const mac = build("darwin");
  const win = build("win32");
  const macHelp = mac.find((item) => item.role === "help");
  const winHelp = win.find((item) => item.role === "help");
  expect(macHelp?.submenu).toEqual([]);
  expect(
    findItem([winHelp as MenuItemConstructorOptions], "About Music Player"),
  ).toBeDefined();
  expect(findItem(mac, "About Music Player")).toBeDefined();
});

it("includes the standard edit / view / window role menus", () => {
  const roles = build("win32").map((item) => item.role);
  expect(roles).toContain("editMenu");
  expect(roles).toContain("viewMenu");
  expect(roles).toContain("windowMenu");
});

it("localises the labels from the shared dictionaries", () => {
  const template = build("win32", "ja");
  expect(template[0]?.label).toBe("ファイル");
  expect(findItem(template, "インポート…")).toBeDefined();
});
