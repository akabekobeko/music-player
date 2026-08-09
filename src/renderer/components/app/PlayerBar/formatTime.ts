/**
 * Format seconds as `m:ss` (or `h:mm:ss` from one hour up) for the
 * PlayerBar time display.
 *
 * @param totalSeconds - Time in seconds; invalid values render as `0:00`.
 * @returns The formatted string.
 */
export const formatTime = (totalSeconds: number): string => {
  const total = Number.isFinite(totalSeconds)
    ? Math.max(0, Math.floor(totalSeconds))
    : 0;
  const seconds = total % 60;
  const minutes = Math.floor(total / 60) % 60;
  const hours = Math.floor(total / 3600);
  const ss = String(seconds).padStart(2, "0");
  return hours > 0
    ? `${hours}:${String(minutes).padStart(2, "0")}:${ss}`
    : `${minutes}:${ss}`;
};
