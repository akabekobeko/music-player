import type { AlbumSummary } from "@mp/ipc";
import { MUSIC_ROW_HEIGHT } from "@/components/app/MusicList/MusicList";

/** Detail-panel chrome outside the track rows (header + paddings, px). */
const DETAIL_CHROME_HEIGHT = 132;

/**
 * Initial height estimate of a detail row, before (and until) the
 * virtualizer measures the rendered panel: header chrome plus one track row
 * per song. Disc headings only exist after the track fetch resolves — the
 * `measureElement` pass corrects the difference.
 *
 * @param album - The expanded album.
 * @returns Estimated row height in px.
 */
export const estimateDetailHeight = (album: AlbumSummary): number =>
  DETAIL_CHROME_HEIGHT + album.musicCount * MUSIC_ROW_HEIGHT;
