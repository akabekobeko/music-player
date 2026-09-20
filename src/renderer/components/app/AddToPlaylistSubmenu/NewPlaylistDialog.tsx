import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useT } from "@/features/i18n/useT";
import { useNewPlaylistDialog } from "./useNewPlaylistDialog";

/**
 * Name dialog of the "Add to playlist ▸ New playlist" flow, mounted once in
 * the AppLayout (the dropdown that started the flow is gone by the time
 * this opens). The creation itself is in `useNewPlaylistDialog`.
 */
export const NewPlaylistDialog = () => {
  const t = useT();
  const { open, name, setName, confirm, cancel } = useNewPlaylistDialog();

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen) {
          cancel();
        }
      }}
    >
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>{t("playlist.nameDialogTitle")}</DialogTitle>
        </DialogHeader>
        <DialogBody>
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
        </DialogBody>
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
