/**
 * English dictionary. Source of truth for the key set: `ja.ts` is typed
 * against these keys, so a missing translation is a type error
 * (docs/specs/web/architecture/i18n.md).
 */
export const en = {
  "site.name": "Parade",
  "site.tagline": "A music player for local audio libraries",
  "site.description":
    "Parade is a free, open-source music player for your local audio library on macOS, Windows and Linux.",
  "nav.home": "Home",
  "nav.download": "Download",
  "header.switchLocale": "Switch to Japanese",
  "header.switchLocale.label": "日本語",
  "header.switchLocale.short": "JA",
  "header.theme": "Dark theme",
  "header.github": "GitHub repository",
  "home.title": "Parade",
  "home.github": "View on GitHub",
  "download.title": "Download",
  "download.pageTitle": "Download | Parade",
  "download.placeholder":
    "The download page is coming soon. Until then, get the latest release from GitHub.",
  "download.releases": "Latest release on GitHub",
  "notFound.title": "Page not found",
  "notFound.pageTitle": "Page not found | Parade",
  "notFound.message": "The page you are looking for does not exist.",
  "footer.copyright": "© 2026 akabeko",
  "footer.license": "MIT License",
  "footer.github": "GitHub",
  "footer.releases": "Releases",
  "footer.issues": "Issues",
  "footer.credits.before": "Music metadata and cover art are provided by ",
  "footer.credits.musicbrainz": "MusicBrainz",
  "footer.credits.and": " and ",
  "footer.credits.coverArtArchive": "Cover Art Archive",
  "footer.credits.after": ".",
} as const;
