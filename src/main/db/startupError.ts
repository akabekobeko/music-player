import { APP_NAME } from "../../shared/constants";
import { tFor } from "../../shared/locales/t/tFor";
import type { Locale } from "../../shared/locales/types";
import { DatabaseDowngradeError } from "./DatabaseDowngradeError";

/** Localised title / message pair for the startup-abort dialog. */
export type StartupErrorContent = {
  /** Localised dialog title (first argument of `dialog.showErrorBox`). */
  readonly title: string;
  /**
   * Localised dialog body. A downgrade gets the fixed "update the app" copy;
   * any other failure gets the generic text with the underlying error
   * message interpolated.
   */
  readonly message: string;
};

/**
 * Build the dialog content shown when opening the library database fails at
 * startup.
 *
 * Pure builder so the Main wiring stays testable without stubbing Electron's
 * `dialog` (`docs/specs/v1.0/architecture/tech-stack.md`). A detected
 * downgrade gets its dedicated "update the app" copy; every other failure
 * (migration error, I/O error, …) falls back to the generic message with the
 * underlying reason interpolated.
 *
 * @param error - The value thrown by `openDatabase`.
 * @param locale - Resolved UI locale.
 * @returns Title and message for `dialog.showErrorBox`.
 */
export const buildStartupErrorContent = (
  error: unknown,
  locale: Locale,
): StartupErrorContent => {
  const t = tFor(locale);

  if (error instanceof DatabaseDowngradeError) {
    return {
      title: t("dialog.db.downgrade.title"),
      message: t("dialog.db.downgrade.message", { appName: APP_NAME }),
    };
  }

  const message = error instanceof Error ? error.message : String(error);
  return {
    title: t("dialog.db.migrationFailed.title"),
    message: t("dialog.db.migrationFailed.message", { message }),
  };
};
