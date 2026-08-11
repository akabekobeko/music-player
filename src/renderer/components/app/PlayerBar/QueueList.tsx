import { Pause, Volume2 } from "lucide-react";
import { formatTime } from "@/libs/formatTime";
import { cn } from "@/libs/utils";
import { LIST_HEIGHT, useQueueList } from "./useQueueList";

/**
 * The virtualised queue rows. Mounted per popover open, so the initial
 * scroll offset (centering the current track) is computed at mount — no
 * imperative scroll effect.
 */
export const QueueList = () => {
  const { queue, playbackState, currentIndex, scrollRef, virtualizer, jumpTo } =
    useQueueList();

  return (
    <div
      ref={scrollRef}
      className="overflow-y-auto"
      style={{ maxHeight: LIST_HEIGHT }}
    >
      <div
        className="relative w-full"
        style={{ height: virtualizer.getTotalSize() }}
      >
        {virtualizer.getVirtualItems().map((item) => {
          const music = queue[item.index];
          if (music === undefined) {
            return null;
          }

          const isCurrent = item.index === currentIndex;
          return (
            <button
              key={item.index}
              type="button"
              className={cn(
                "absolute top-0 left-0 flex w-full items-center gap-2 px-3 text-left",
                isCurrent ? "bg-accent/60" : "hover:bg-accent/40",
              )}
              style={{
                height: item.size,
                transform: `translateY(${item.start}px)`,
              }}
              onClick={() => jumpTo(music)}
            >
              <span className="w-4 shrink-0 text-muted-foreground">
                {isCurrent &&
                  (playbackState === "playing" ? (
                    <Volume2 aria-hidden className="size-4 text-primary" />
                  ) : (
                    <Pause aria-hidden className="size-4 text-primary" />
                  ))}
              </span>
              <span className="min-w-0 flex-1">
                <span
                  className={cn(
                    "block truncate text-sm",
                    isCurrent && "font-medium text-primary",
                  )}
                >
                  {music.title}
                </span>
                <span className="block truncate text-[11px] text-muted-foreground">
                  {music.artist}
                </span>
              </span>
              <span className="shrink-0 font-mono text-muted-foreground text-xs tabular-nums">
                {formatTime(music.durationMs / 1000)}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
