/** Pages of the site. `notFound` is English only and has no locale variants. */
export type Page = "home" | "download" | "notFound";

/**
 * Route path of each localised page, relative to the locale root, as
 * accepted by the `astro:i18n` URL helpers. `undefined` marks a page that
 * exists in one language only.
 */
export const pagePath: Readonly<Record<Page, string | undefined>> = {
  home: "",
  download: "download",
  notFound: undefined,
};

/** Header navigation entries, in display order. */
export const navPages = ["home", "download"] as const satisfies readonly Page[];
