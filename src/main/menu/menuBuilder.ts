import type { MenuItemConstructorOptions } from "electron";
import { tFor } from "../../shared/locales/t/tFor";
import type { Locale } from "../../shared/locales/types";
import type { MenuAction, MenuStateSnapshot } from "../ipc/types";

/**
 * Pure application-menu template builder
 * (`docs/specs/v1.0/architecture/process-model.md`). Free of value-level
 * `electron` imports so the structure is unit-testable; `applicationMenu.ts`
 * feeds the template into `Menu.buildFromTemplate`.
 *
 * Menu actions never run app logic here — every custom item forwards a
 * {@link MenuAction} through `onAction`, which Main pushes to the Renderer
 * via `mp:menu:action`.
 */

/** Inputs deciding the template. */
export type MenuBuildOptions = {
  readonly platform: NodeJS.Platform;
  readonly locale: Locale;
  /** App display name (the macOS app menu title / about label). */
  readonly appName: string;
  /**
   * Latest `mp:menu:setState` snapshot — gates the playback items
   * (Controls > Stop enables only while a track is loaded).
   */
  readonly state: MenuStateSnapshot;
  /** Receives the action of a clicked custom item. */
  readonly onAction: (action: MenuAction) => void;
};

/**
 * Build the application menu template.
 *
 * @param options - Platform, locale, state, and the action sink.
 * @returns Template for `Menu.buildFromTemplate`.
 */
export const buildMenuTemplate = (
  options: MenuBuildOptions,
): MenuItemConstructorOptions[] => {
  const { platform, locale, appName, state, onAction } = options;
  const t = tFor(locale);
  const isMac = platform === "darwin";

  const aboutItem: MenuItemConstructorOptions = {
    label: t("menu.about", { appName }),
    click: () => onAction("showAbout"),
  };
  const settingsItem: MenuItemConstructorOptions = {
    label: t("menu.settings"),
    accelerator: "CmdOrCtrl+,",
    click: () => onAction("openSettings"),
  };

  return [
    // macOS app menu; other platforms place these under File / Help.
    ...(isMac
      ? [
          {
            label: appName,
            submenu: [
              aboutItem,
              { type: "separator" },
              settingsItem,
              { type: "separator" },
              { role: "hide" },
              { role: "hideOthers" },
              { role: "unhide" },
              { type: "separator" },
              { role: "quit" },
            ],
          } satisfies MenuItemConstructorOptions,
        ]
      : []),
    {
      label: t("menu.file"),
      submenu: [
        {
          label: t("menu.import"),
          accelerator: "CmdOrCtrl+O",
          click: () => onAction("import"),
        },
        ...(isMac
          ? [{ role: "close" } satisfies MenuItemConstructorOptions]
          : [
              { type: "separator" } satisfies MenuItemConstructorOptions,
              settingsItem,
              { type: "separator" } satisfies MenuItemConstructorOptions,
              { role: "quit" } satisfies MenuItemConstructorOptions,
            ]),
      ],
    },
    { label: t("menu.edit"), role: "editMenu" },
    { label: t("menu.view"), role: "viewMenu" },
    {
      // Playback controls (Apple Music-style: between View and Window).
      label: t("menu.controls"),
      submenu: [
        {
          label: t("menu.stop"),
          accelerator: "CmdOrCtrl+.",
          enabled: state.hasTrack,
          click: () => onAction("stop"),
        },
      ],
    },
    { label: t("menu.window"), role: "windowMenu" },
    {
      label: t("menu.help"),
      role: "help",
      submenu: isMac ? [] : [aboutItem],
    },
  ];
};
