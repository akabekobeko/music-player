import type { LastView } from "@mp/ipc";
import { artistPathOf } from "@/pages/artists/artistPath";

/**
 * Router path of a {@link LastView} — the inverse of `lastViewOf`.
 *
 * @param view - View to navigate to.
 * @returns Pathname (without the `#`).
 */
export const lastViewPath = (view: LastView): string => {
  switch (view.section) {
    case "artists":
      return view.artist !== undefined ? artistPathOf(view.artist) : "/artists";
    case "albums":
      return "/albums";
    case "playlists":
      return view.playlist !== undefined
        ? `/playlists/${view.playlist}`
        : "/playlists";
  }
};
