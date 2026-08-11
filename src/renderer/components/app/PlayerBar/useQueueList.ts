import type { Music } from "@mp/ipc";
import { useVirtualizer } from "@tanstack/react-virtual";
import { useRef } from "react";
import {
  usePlaybackState,
  usePlayerCommands,
  usePlayerState,
} from "@/features/player/PlayerProvider";

/** Row height of one queue entry (px) — drives the virtualizer. */
export const ROW_HEIGHT = 44;

/** Height of the scrolling list viewport (px). */
export const LIST_HEIGHT = 320;

/**
 * Logic of `QueueList`: the queue rows' virtualiser (whose initial offset
 * centres the current track at mount) and the click-to-jump handler. The
 * component only renders what this hook returns.
 */
export const useQueueList = () => {
  const { queue, queueSource, current } = usePlayerState();
  const commands = usePlayerCommands();
  const playbackState = usePlaybackState();
  const scrollRef = useRef<HTMLDivElement | null>(null);

  const currentIndex =
    current !== null ? queue.findIndex((music) => music.id === current.id) : -1;
  const virtualizer = useVirtualizer({
    count: queue.length,
    getScrollElement: () => scrollRef.current,
    estimateSize: () => ROW_HEIGHT,
    overscan: 10,
    initialOffset: Math.max(
      0,
      currentIndex * ROW_HEIGHT - (LIST_HEIGHT - ROW_HEIGHT) / 2,
    ),
  });

  /** Jump playback to this queue position (same queue, same source). */
  const jumpTo = (music: Music): void => {
    void commands.playMusic(music, queue, queueSource);
  };

  return {
    queue,
    playbackState,
    currentIndex,
    scrollRef,
    virtualizer,
    jumpTo,
  };
};
