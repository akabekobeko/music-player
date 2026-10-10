/** External links to the repository, shared by the header, footer and pages. */
export const REPOSITORY_URL = "https://github.com/akabekobeko/parade";
export const RELEASES_URL = `${REPOSITORY_URL}/releases`;
export const LATEST_RELEASE_URL = `${RELEASES_URL}/latest`;
export const ISSUES_URL = `${REPOSITORY_URL}/issues`;
export const LICENSE_URL = `${REPOSITORY_URL}/blob/main/LICENSE`;

/**
 * Prefix a site-relative path with the configured `base` (`/parade`), for
 * files served from `public/`. Page links go through the `astro:i18n`
 * helpers instead, which add the base themselves.
 *
 * @param path - Path relative to the site root, without a leading slash.
 * @returns The path with the base prepended.
 */
export const withBase = (path: string): string =>
  `${import.meta.env.BASE_URL.replace(/\/$/, "")}/${path}`;
