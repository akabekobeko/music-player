import { useState, useSyncExternalStore } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useT } from "@/features/i18n/useT";
import { addToPlaylistStore } from "@/features/playlist/addToPlaylistStore";
import {
  appendMusicsToPlaylist,
  createStaticPlaylist,
} from "@/features/playlist/playlistCommands";
import { toastStore } from "@/features/toast/toastStore";

/**
 * Name dialog of the "Add to playlist ▸ New playlist" flow, mounted once in
 * the AppLayout (the dropdown that started the flow is gone by the time
 * this opens). Confirming creates the playlist and appends the stashed
 * tracks in one go.
 */
export const NewPlaylistDialog = () => {
  const t = useT();
  const pending = useSyncExternalStore(
    addToPlaylistStore.subscribe,
    addToPlaylistStore.getSnapshot,
  );
  const [name, setName] = useState("");

  const confirm = async (): Promise<void> => {
    if (pending === null) {
      return;
    }

    const trimmed = name.trim();
    const created = await createStaticPlaylist(
      trimmed !== "" ? trimmed : t("playlist.defaultName"),
    );
    addToPlaylistStore.close();
    setName("");
    if (
      created !== null &&
      (await appendMusicsToPlaylist(created.id, pending))
    ) {
      toastStore.show(
        t("playlist.addedToast", { count: pending.length, name: created.name }),
      );
    }
  };

  const cancel = (): void => {
    addToPlaylistStore.close();
    setName("");
  };

  return (
    <Dialog
      open={pending !== null}
      onOpenChange={(open) => {
        if (!open) {
          cancel();
        }
      }}
    >
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>{t("playlist.nameDialogTitle")}</DialogTitle>
        </DialogHeader>
        <Input
          autoFocus
          placeholder={t("playlist.defaultName")}
          value={name}
          onChange={(event) => setName(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              void confirm();
            }
          }}
        />
        <DialogFooter>
          <Button variant="outline" onClick={cancel}>
            {t("common.cancel")}
          </Button>
          <Button onClick={() => void confirm()}>{t("playlist.create")}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
