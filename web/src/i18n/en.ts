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
  "home.hero.summary":
    "Runs on macOS, Windows and Linux. English and Japanese UI. Open source under the MIT License, built with Electron.",
  "home.hero.screenshot.alt":
    "Artists view of Parade in the dark theme, showing the albums of Milo Ashgrove with a song playing",
  "home.features.title": "Features",
  "home.feature.artists.title": "Browse by artist",
  "home.feature.artists.body":
    "Pick an artist from the initial-letter list and look through their albums and songs while you listen. Artist images and album artwork make the library yours to recognise at a glance.",
  "home.feature.artists.alt":
    "Artists view listing the albums of Milo Ashgrove with artist images and album artwork",
  "home.feature.albums.title": "Filter your albums",
  "home.feature.albums.body":
    "Narrow the album grid by genre, decade or a few typed letters from the sidebar, then enjoy the covers laid out side by side.",
  "home.feature.albums.alt":
    "Albums view with the sidebar filtering by the Jazz genre and the 1990s, showing a grid of album covers",
  "home.feature.playlists.title": "Playlists and smart playlists",
  "home.feature.playlists.body":
    "Arrange songs by hand in a regular playlist, or let a smart playlist keep itself up to date from your conditions. The song table lets you choose the columns, resize and reorder them, and sort by any of them.",
  "home.feature.playlists.alt":
    "Playlists view showing the My Best playlist as a table with the title, artist, album, album artist, genre and year columns",
  "home.feature.metadata.title": "Edit and complete metadata",
  "home.feature.metadata.body":
    "Edit the title, artist, artwork and more in the song info dialog and write the changes back to the file, for one song or for many at once. Fetch the missing details and cover art from MusicBrainz and Cover Art Archive and choose, field by field, what to keep.",
  "home.feature.metadata.alt":
    "Song info dialog with the Details tab showing the editable title, artist, album, genre and year fields",
  "home.feature.player.title": "Play your way",
  "home.feature.player.body":
    "Queue songs up, shuffle them and control playback from the media keys of your OS. Parade plays mp3, flac, m4a / mp4, ogg / opus, wav, aiff, wma and ape.",
  "home.feature.player.alt":
    "Player bar with a song playing and the queue popover listing the upcoming songs",
  "home.feature.theme.title": "Light and dark",
  "home.feature.theme.body":
    "A dark and a light theme, following your OS setting or fixed to the one you prefer.",
  "home.feature.theme.alt":
    "Artists view of Parade in the light theme, showing the albums of Milo Ashgrove",
  "home.feature.language.title": "English and Japanese",
  "home.feature.language.body":
    "Choose English, Japanese or your system language on the settings page. The theme is switched there as well.",
  "home.feature.language.alt":
    "Settings page with the theme set to Dark and the language set to English",
  "home.cta.title": "Get Parade",
  "home.cta.body": "Free and open source, for macOS, Windows and Linux.",
  "home.cta.button": "Go to downloads",
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
