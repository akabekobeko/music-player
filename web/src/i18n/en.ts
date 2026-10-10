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
  "home.download": "Download",
  "home.download.mac": "Download for macOS",
  "home.download.win": "Download for Windows",
  "home.download.linux": "Download for Linux",
  "home.latest": "Latest version {version}, released {date}",
  "download.title": "Download Parade",
  "download.pageTitle": "Download | Parade",
  "download.description":
    "Download Parade for macOS, Windows and Linux. Free and open source.",
  "download.released": "Released {date}",
  "download.releaseNotes": "Release notes",
  "download.fetchFailed":
    "Could not load the latest release (dev server only): {message}",
  "download.card.mac": "macOS",
  "download.card.mac-arm64.note": "Apple Silicon (M1 or later)",
  "download.card.mac-x64.note": "Intel",
  "download.card.win": "Windows",
  "download.card.win-x64.note": "64-bit",
  "download.card.linux": "Linux",
  "download.card.linux-x64.note": "x86_64",
  "download.card.detected": "Detected",
  "download.button.dmg": "Download .dmg",
  "download.button.exe": "Download installer (.exe)",
  "download.button.AppImage": "Download AppImage",
  "download.link.zip": ".zip",
  "download.link.zip.win": "Portable (.zip)",
  "download.link.deb": ".deb (Debian / Ubuntu)",
  "download.card.missing": "Check GitHub Releases",
  "download.macHelp":
    "Not sure which Mac you have? Open the Apple menu, choose About This Mac and look at the Chip line. The Intel build runs on Apple Silicon through Rosetta, but slower.",
  "download.notes.title": "Before you run it",
  "download.notes.intro":
    "The binaries are not code-signed: an Apple Developer Program membership and a code-signing certificate cost money, and Parade is run at no cost. Each OS therefore warns on the first launch.",
  "download.notes.mac.title": "macOS",
  "download.notes.mac.body":
    "Gatekeeper blocks the app. Right-click Parade.app and choose Open the first time. On macOS 15 or later you may also have to allow it under System Settings, Privacy & Security, Open Anyway. If it still does not open, run this in Terminal:",
  "download.notes.windows.title": "Windows",
  "download.notes.windows.body":
    "SmartScreen shows a warning. Choose More info, then Run anyway.",
  "download.notes.linux.title": "Linux",
  "download.notes.linux.body":
    "Make the AppImage executable before running it. The .deb package installs with apt:",
  "download.more.title": "More",
  "download.more.allReleases": "All releases on GitHub",
  "download.more.allReleases.body":
    "Older versions and the full release notes are on GitHub Releases.",
  "download.more.requirements": "Requirements",
  "download.more.requirements.before":
    "Parade runs wherever the bundled Chromium (Electron) runs. If it does not start on your system, let us know on ",
  "download.more.requirements.link": "GitHub Issues",
  "download.more.requirements.after": ".",
  "download.more.formats": "Supported audio formats",
  "download.more.formats.body":
    "mp3, flac, m4a / mp4, ogg / opus, wav, aiff, wma, ape",
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
