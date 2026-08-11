/** Whether the runtime exposes MediaSession (guards Node test runs too). */
export const hasMediaSession = (): boolean =>
  typeof navigator !== "undefined" && "mediaSession" in navigator;
