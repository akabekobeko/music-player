/**
 * Top full-width band doubling as the title bar
 * (`docs/specs/v1.0/renderer/routing-layout.md`).
 *
 * The band itself is a drag region; every interactive element added in
 * Phase 3 (buttons, sliders, popover triggers) must opt out individually
 * with `.app-region-no-drag`. The horizontal paddings are the title-bar
 * safe areas — traffic lights (macOS) on the left, Window Controls Overlay
 * (Windows / Linux) on the right — derived in `App.css`.
 */
export const PlayerBar = () => (
  <header className="app-region-drag col-span-2 flex h-(--playerbar-height) items-center border-b bg-sidebar pl-(--titlebar-safe-left) pr-(--titlebar-safe-right)">
    {/* Placeholder frame; the player controls land here in Phase 3. */}
    <p className="flex-1 text-center text-xs text-muted-foreground">
      Music Player
    </p>
  </header>
);
