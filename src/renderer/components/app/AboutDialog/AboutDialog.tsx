import { useSyncExternalStore } from "react";
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { aboutStore } from "@/features/about/aboutStore";
import { useT } from "@/features/i18n/useT";

/**
 * About dialog (menu → About), mounted once in the AppLayout. Shows the
 * runtime versions reported by `mp:app:getVersions`.
 */
export const AboutDialog = () => {
  const t = useT();
  const state = useSyncExternalStore(
    aboutStore.subscribe,
    aboutStore.getSnapshot,
  );
  return (
    <Dialog
      open={state.open}
      onOpenChange={(open) => {
        if (!open) {
          aboutStore.close();
        }
      }}
    >
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>{t("app.name")}</DialogTitle>
          {state.open && state.versions !== null && (
            <DialogDescription>
              {t("about.version", { version: state.versions.app })}
            </DialogDescription>
          )}
        </DialogHeader>
        <DialogBody>
          {state.open && state.error !== null && (
            <p className="break-all text-destructive text-sm">
              {t("library.loadFailed", { message: state.error.message })}
            </p>
          )}
          {state.open && state.versions !== null && (
            <dl className="grid grid-cols-[auto_1fr] gap-x-6 gap-y-1 text-sm">
              <dt className="text-muted-foreground">Electron</dt>
              <dd className="tabular-nums">{state.versions.electron}</dd>
              <dt className="text-muted-foreground">Chromium</dt>
              <dd className="tabular-nums">{state.versions.chrome}</dd>
              <dt className="text-muted-foreground">Node.js</dt>
              <dd className="tabular-nums">{state.versions.node}</dd>
            </dl>
          )}
        </DialogBody>
      </DialogContent>
    </Dialog>
  );
};
