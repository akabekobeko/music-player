import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useT } from "@/features/i18n/useT";
import {
  usePlayerCommands,
  usePlayerState,
} from "@/features/player/PlayerProvider";

/** Clear button; disabled when there is nothing to clear. */
export const ClearQueueButton = () => {
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
