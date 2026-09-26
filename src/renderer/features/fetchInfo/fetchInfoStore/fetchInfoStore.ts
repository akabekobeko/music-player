import { musicInfoStore } from "@/features/library/musicInfoStore";
import { getActivePlayer } from "@/features/player/playerBridge";
import {
  createFetchInfoStore,
  type FetchInfoStore,
} from "./createFetchInfoStore";

/**
 * The app-wide fetch entrance store, wired to `window.mp`. An update
 * reaches the queue / current track through the mounted player and the
 * artist / album views through the music info store's applied listeners
 * (`docs/specs/v1.2/features/fetch-menu.md`).
 */
export const fetchInfoStore: FetchInfoStore = createFetchInfoStore({
  fetchMusicInfo: (request) => window.mp.musicbrainz.fetchMusicInfo(request),
  cancelFetch: () => window.mp.musicbrainz.cancelFetch(),
  applied: (update) => {
    // Null-safe: the bridge is set once PlayerProvider mounts.
    getActivePlayer()?.commands.updateMusics(
      update.updated.map((entry) => entry.music),
    );
    musicInfoStore.notifyApplied(update);
  },
});
