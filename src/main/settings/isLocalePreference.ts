/** Type guard for the persisted locale preference. */
export const isLocalePreference = (
  value: unknown,
): value is "en" | "ja" | "system" =>
  value === "en" || value === "ja" || value === "system";
