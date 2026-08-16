import type { Music } from "@mp/ipc";
import { useSyncExternalStore } from "react";
import { queryKeys } from "@/features/library/queryStore/queryKeys";
import { useLibraryQuery } from "@/features/library/useLibraryQuery";
import {
  usePlaybackState,
  usePlayerCommands,
  usePlayerState,
} from "@/features/player/PlayerProvider";
import { matchesTrackFilter } from "@/features/trackFilter/matchesTrackFilter";
import { trackFilterStore } from "@/features/trackFilter/trackFilterStore";

/**
 * Logic of `AlbumDetail`: the album's tracks, the disc split, and every
 * playback / library action — each queues **only this album's tracks**.
 * The component only renders what this hook returns.
 */
export const useAlbumDetail = (albumKey: string) => {
  const musicsState = useLibraryQuery<readonly Music[]>(
    queryKeys.musicsByAlbum(albumKey),
  );
  const commands = usePlayerCommands();
  const { current } = usePlayerState();
  const playbackState = usePlaybackState();

  const { applied: trackFilter } = useSyncExternalStore(
    trackFilterStore.subscribe,
    trackFilterStore.getSnapshot,
  );

  // The toolbar's song filter narrows the track list to match the grid,
  // which the same text filters through SQL (`AlbumFilter.musicTitle`).
  const musics = (
    musicsState.status === "success" ? musicsState.value : []
  ).filter((music) => matchesTrackFilter(music.title, trackFilter.albums));
  const discNumbers = [...new Set(musics.map((music) => music.disc))];

  const playFrom = (music: Music): void => {
    void commands.playMusic(music, [...musics], "album");
  };

  const playAll = (): void => {
    const first = musics[0];
    if (first !== undefined) {
      playFrom(first);
    }
  };

  const removeFromLibrary = (music: Music): void => {
    void window.mp.library.removeMusics({ musicIds: [music.id] });
    // The broadcast mp:library:changed invalidates the query store, which
    // refetches this panel automatically.
  };

  const playingStateOf = (music: Music): "playing" | "paused" | null => {
    if (current === null || current.id !== music.id) {
      return null;
    }

    return playbackState === "playing" ? "playing" : "paused";
  };

  return {
    musics,
    musicsState,
    discNumbers,
    commands,
    playFrom,
    playAll,
    removeFromLibrary,
    playingStateOf,
  };
};
