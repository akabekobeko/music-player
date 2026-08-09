import type { Dictionary } from "./types";

/**
 * English translation table.
 *
 * Source of truth for the key set: every other locale must define exactly the
 * same keys (enforced by `t.test.ts`). Additions go here first so reviewers
 * can read the natural-English copy alongside the keys before translating the
 * other dictionaries.
 */
export const en: Dictionary = {
  "app.name": "Music Player",
  "dialog.db.downgrade.title": "Cannot Start",
  "dialog.db.downgrade.message":
    "The library database was created by a newer version of {appName}. Update the app to continue.",
  "dialog.db.migrationFailed.title": "Database Error",
  "dialog.db.migrationFailed.message":
    "Failed to update the library database: {message}",
  "sidebar.import": "Import…",
  "import.dialog.title": "Import Music",
  "import.dialog.expanding": "Scanning for audio files…",
  "import.dialog.count": "{count} files will be imported.",
  "import.dialog.empty": "No importable audio files were found.",
  "import.dialog.failed": "Import failed: {message}",
  "import.dialog.cancel": "Cancel",
  "import.dialog.run": "Import",
  "import.dialog.close": "Close",
  "import.progress.importing": "Importing {current} / {total}",
  "import.progress.errors": "{count} failed",
  "import.progress.cancelling": "Cancelling…",
  "import.summary.done": "Import finished.",
  "import.summary.cancelled": "Import was cancelled.",
  "import.summary.imported": "Added: {count}",
  "import.summary.updated": "Updated: {count}",
  "import.summary.failed": "{count} files failed (details)",
  "player.noMusic": "No music playing",
  "player.previous": "Previous track",
  "player.next": "Next track",
  "player.play": "Play",
  "player.pause": "Pause",
  "player.stop": "Stop",
  "player.volume": "Volume",
  "player.mute": "Mute",
  "player.unmute": "Unmute",
  "player.errorTitle": "Playback error",
  "player.dismiss": "Dismiss",
  "artist.search": "Search artists",
  "artist.unknown": "Unknown Artist",
  "artist.songs": "{count} songs",
  "artist.empty": "No artists yet. Import music to get started.",
  "artist.albumCount": "{count} albums",
  "artist.selectPrompt": "Select an artist from the list.",
  "album.disc": "Disc {number}",
  "album.filter.search": "Search albums",
  "album.filter.genre": "Genre",
  "album.filter.decade": "Decade",
  "album.filter.unknownYear": "Unknown",
  "album.filter.clear": "Clear filters",
  "album.noMatch": "No albums match the filters.",
  "album.empty": "No albums yet. Import music to get started.",
  "player.shuffle": "Shuffle",
  "menu.playNext": "Play next",
  "menu.addToQueue": "Add to queue",
  "menu.addToPlaylist": "Add to playlist",
  "menu.removeFromLibrary": "Remove from library",
  "library.loadFailed": "Failed to load: {message}",
};
