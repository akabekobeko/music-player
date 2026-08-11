import { ListMusic, Pause, Trash2, Volume2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useT } from "@/features/i18n/useT";
import {
  usePlayerCommands,
  usePlayerState,
} from "@/features/player/PlayerProvider";
import { formatTime } from "@/libs/formatTime";
import { cn } from "@/libs/utils";
import { LIST_HEIGHT, useQueueList } from "./useQueueList";

/**
 * Queue popover behind the PlayerBar's queue button
 * (`docs/specs/v1.0/features/playlist.md`): the full current queue
 * (virtualised scroll opened around the current track), click-to-jump, and
 * queue clear. v1.0 has no dedicated queue screen — this is the one queue
 * view; reorder / row removal are v1.x.
 */
export const QueuePopover = () => {
  const t = useT();
  const { queue } = usePlayerState();
  return (
    <Popover>
      <PopoverTrigger
        render={
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label={t("player.queue")}
          />
        }
      >
        <ListMusic />
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 p-0">
        <div className="flex items-center gap-2 border-b px-3 py-2">
          <span className="flex-1 font-medium text-sm">
            {t("player.queue")}
          </span>
          <span className="text-muted-foreground text-xs">
            {t("artist.songs", { count: queue.length })}
          </span>
          <ClearQueueButton />
        </div>
        {queue.length === 0 ? (
          <p className="px-3 py-4 text-muted-foreground text-sm">
            {t("player.queueEmpty")}
          </p>
        ) : (
          <QueueList />
        )}
      </PopoverContent>
    </Popover>
  );
};

/** Clear button; disabled when there is nothing to clear. */
const ClearQueueButton = () => {
  const t = useT();
  const { queue } = usePlayerState();
  const commands = usePlayerCommands();
  return (
    <Button
      variant="ghost"
      size="icon-sm"
      aria-label={t("player.clearQueue")}
      disabled={queue.length === 0}
      onClick={() => commands.replaceQueue([], "none")}
    >
      <Trash2 />
    </Button>
  );
};

/**
 * The virtualised queue rows. Mounted per popover open, so the initial
 * scroll offset (centering the current track) is computed at mount — no
 * imperative scroll effect.
 */
const QueueList = () => {
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
