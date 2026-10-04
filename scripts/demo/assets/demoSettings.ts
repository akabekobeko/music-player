/**
 * Contents of the demo `settings.json`
 * (`AppSettings` in `src/main/ipc/types.ts`).
 *
 * The window has no position so the OS places it, and a fixed size so
 * screenshots come out the same on every machine. The app opens on the
 * Artist view with the artist of the playable track selected.
 */
export const DEMO_SETTINGS = {
  version: 1,
  window: {
    width: 1280,
    height: 800,
    maximized: false,
  },
  theme: "dark",
  sidebar: {
    open: true,
    width: 296,
  },
  lastView: {
    section: "artists",
    artist: "Milo Ashgrove",
  },
} as const;
