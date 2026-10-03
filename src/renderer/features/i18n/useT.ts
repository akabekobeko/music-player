import { tFor } from "../../../shared/locales/t/tFor";
import type { BoundTranslate } from "../../../shared/locales/types";
import { useLocale } from "./useLocale";

/**
 * Locale-bound translation hook for Renderer components.
 *
 * Binds the translation helper to the active locale (`useLocale`) during
 * render; a plain derived value, no memoisation needed at this size.
 *
 * @returns A `(key, params?) => string` helper bound to the active locale.
 */
export const useT = (): BoundTranslate => tFor(useLocale());
