import type { LibraryStats, ThemePreference } from "@mp/ipc";
import { queryKeys } from "@/features/library/queryStore";
import { useLibraryQuery } from "@/features/library/useLibraryQuery";
import {
  useSettings,
  useSettingsCommands,
} from "@/features/settings/SettingsProvider";
import type { LocalePreference } from "../../../../shared/locales/types";

/**
 * Logic of `PageContent`: the current settings, the library stats, and the
 * update handlers. Every change goes through `mp:settings:set`; the merged
 * response is the single source of truth (SettingsProvider), so the page
 * holds no local settings state.
 */
export const usePageContent = () => {
  const settings = useSettings();
  const commands = useSettingsCommands();
  const statsState = useLibraryQuery<LibraryStats>(queryKeys.stats);

  const setTheme = (theme: string | null): void => {
    void commands.update({ theme: theme as ThemePreference });
  };

  const setLocale = (locale: string | null): void => {
    void commands.update({ locale: locale as LocalePreference });
  };

  return { settings, statsState, setTheme, setLocale };
};
