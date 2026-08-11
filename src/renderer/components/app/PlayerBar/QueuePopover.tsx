import { ListMusic } from "lucide-react";
import { HStack } from "@/components/app/stacks";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useT } from "@/features/i18n/useT";
import { usePlayerState } from "@/features/player/PlayerProvider";
import { ClearQueueButton } from "./ClearQueueButton";
import { QueueList } from "./QueueList";

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
        <HStack className="border-b px-3 py-2">
          <span className="flex-1 font-medium text-sm">
            {t("player.queue")}
          </span>
          <span className="text-muted-foreground text-xs">
            {t("artist.songs", { count: queue.length })}
          </span>
          <ClearQueueButton />
        </HStack>
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
