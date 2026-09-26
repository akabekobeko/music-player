import { useCallback, useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import {
  type MusicInfoState,
  musicInfoStore,
} from "@/features/library/musicInfoStore";
import {
  MusicInfoDialogContent,
  type MusicInfoShell,
  type MusicInfoTab,
} from "./MusicInfoDialogContent";

type Props = {
  /** The tracks on display and their neighbours. */
  readonly state: MusicInfoState;
};

/**
 * One open spell of the music info dialog: the `Dialog` root and its popup,
 * which stay mounted while the header arrows step from track to track
 * (`docs/specs/v1.1/features/music-info-dialog.md`, previous / next
 * navigation), so the
 * popup neither re-animates nor loses the open tab. The content inside is
 * keyed on the track ids: stepping remounts it, discarding unsaved edits
 * with the rest of its state.
 *
 * What the root and the popup need from the content — whether an apply is
 * running (Esc / backdrop must not close then) and whether the popup should
 * be wide (a fetched candidate shows two compare columns) — the content
 * reports through `onShellChange`.
 */
export const MusicInfoDialogSession = ({ state }: Props) => {
  const [tab, setTab] = useState<MusicInfoTab>("details");
  const [shell, setShell] = useState<MusicInfoShell>({
    applying: false,
    wide: false,
  });
  // Stable so the content's reporting effect runs only when its values
  // change; an unchanged report keeps the state object as is.
  const reportShell = useCallback((next: MusicInfoShell) => {
    setShell((current) =>
      current.applying === next.applying && current.wide === next.wide
        ? current
        : next,
    );
  }, []);
  const primary = state.musics[0];
  if (primary === undefined) {
    return null;
  }

  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open && !shell.applying) {
          musicInfoStore.close();
        }
      }}
    >
      <DialogContent
        showCloseButton={false}
        className={
          shell.wide
            ? "sm:max-w-2xl md:max-w-3xl xl:max-w-4xl"
            : "sm:max-w-lg md:max-w-2xl xl:max-w-3xl"
        }
      >
        <MusicInfoDialogContent
          key={state.musics.map((music) => music.id).join(",")}
          musics={state.musics}
          primary={primary}
          previous={state.previous}
          next={state.next}
          tab={tab}
          onTabChange={setTab}
          onShellChange={reportShell}
        />
      </DialogContent>
    </Dialog>
  );
};
