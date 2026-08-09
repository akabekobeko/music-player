import type { AppSettings, DeepPartial } from "@mp/ipc";
import { createContext, type ReactNode, useContext, useState } from "react";
import { applyThemePreference } from "./theme";

/**
 * Settings state for the Renderer (`docs/specs/v1.0/renderer/state-management.md`).
 *
 * The initial value is loaded in the bootstrap (before `createRoot`), so no
 * "settings loading" intermediate state exists in the tree. Updates go
 * through the `update` command, and the IPC response — Main's merged
 * snapshot — is the single source of truth written back into state.
 *
 * State and Commands live in separate contexts so command-only consumers do
 * not re-render on settings changes.
 */

type SettingsCommands = {
  /**
   * Apply a settings patch via `mp:settings:set`.
   *
   * On success the merged response replaces local state and, when the patch
   * contained a theme, the theme is applied in the same handler (no effect
   * syncing). Failures are logged; local state keeps the previous value.
   */
  readonly update: (patch: DeepPartial<AppSettings>) => Promise<void>;
};

const SettingsStateContext = createContext<AppSettings | null>(null);
const SettingsCommandsContext = createContext<SettingsCommands | null>(null);

/**
 * Provide settings state and commands to the app.
 *
 * @param props.initialSettings - Settings loaded by the bootstrap.
 */
export const SettingsProvider = ({
  initialSettings,
  children,
}: {
  readonly initialSettings: AppSettings;
  readonly children: ReactNode;
}) => {
  const [settings, setSettings] = useState(initialSettings);
  // useState initializer: created exactly once, stable without useCallback.
  const [commands] = useState<SettingsCommands>(() => ({
    update: async (patch) => {
      const result = await window.mp.settings.set({ patch });
      if (!result.ok) {
        console.error("Failed to update settings", result.error);
        return;
      }

      setSettings(result.value);
      if (patch.theme !== undefined) {
        applyThemePreference(result.value.theme);
      }
    },
  }));

  return (
    <SettingsStateContext.Provider value={settings}>
      <SettingsCommandsContext.Provider value={commands}>
        {children}
      </SettingsCommandsContext.Provider>
    </SettingsStateContext.Provider>
  );
};

/**
 * Read the current settings.
 *
 * @returns The settings snapshot held by {@link SettingsProvider}.
 */
export const useSettings = (): AppSettings => {
  const settings = useContext(SettingsStateContext);
  if (settings === null) {
    throw new Error("useSettings must be used within SettingsProvider");
  }

  return settings;
};

/**
 * Read the settings commands (stable reference, never re-renders consumers).
 *
 * @returns The commands object created by {@link SettingsProvider}.
 */
export const useSettingsCommands = (): SettingsCommands => {
  const commands = useContext(SettingsCommandsContext);
  if (commands === null) {
    throw new Error("useSettingsCommands must be used within SettingsProvider");
  }

  return commands;
};
