import type { Music } from "@mp/ipc";
import { CloudDownload, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsTrigger } from "@/components/ui/tabs";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useT } from "@/features/i18n/useT";
import { cn } from "@/libs/utils";
import { HStack } from "../../stacks";
import { DialogTabList } from "../DialogTabList";
import { ApplyFailures } from "./ApplyFailures";
import { ArtworkPanel } from "./ArtworkPanel";
import { DetailsPanel } from "./DetailsPanel";
import { FilePanel } from "./FilePanel";
import { fetchErrorKeyOf } from "./fetchErrorKeyOf";
import { useMusicInfoDialog } from "./useMusicInfoDialog";

type Props = {
  /** Tracks under edit; never empty. */
  readonly musics: readonly Music[];
  /** The first track (seeds the form and the File tab). */
  readonly primary: Music;
};

/**
 * One session of the music info dialog: the popup with its three tabs and
 * the Fetch / Cancel / Apply footer. Owns the `Dialog` root so every way of
 * closing (Cancel, Esc, backdrop, the X) goes through the hook's `close`,
 * which refuses while an apply runs (a running fetch is simply dropped). The parent remounts this
 * component per track set, so the form starts from the right defaults
 * every time. The popup widens once a candidate is shown so the two
 * compare columns never stack (`docs/specs/v1.2/features/music-info-compare.md`).
 */
export const MusicInfoDialogContent = ({ musics, primary }: Props) => {
  const t = useT();
  const {
    form,
    imageUrl,
    canRemoveArtwork,
    unsupportedImageType,
    stopsPlayback,
    applying,
    progress,
    canApply,
    error,
    failures,
    candidate,
    adopted,
    adoptPicture,
    fetchedImageUrl,
    fetching,
    canFetch,
    fetchError,
    notFound,
    selectFile,
    removeArtwork,
    apply,
    close,
    fetchCandidate,
    setAdoptedField,
    setAdoptPicture,
    onFieldEdited,
  } = useMusicInfoDialog(musics);
  const busy = applying || fetching;
  const fetchMessage = fetchError === null ? null : fetchErrorKeyOf(fetchError);

  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open) {
          close();
        }
      }}
    >
      <DialogContent
        className={cn(
          candidate === null
            ? "sm:max-w-lg md:max-w-2xl xl:max-w-3xl"
            : "sm:max-w-2xl md:max-w-3xl xl:max-w-4xl",
        )}
      >
        <DialogHeader>
          <DialogTitle>
            {musics.length === 1
              ? t("musicInfo.title")
              : t("musicInfo.titleCount", { count: musics.length })}
          </DialogTitle>
        </DialogHeader>
        <DialogBody className="h-[60vh] px-0 pb-0">
          <Tabs defaultValue="details" className="min-h-0 flex-1">
            <DialogTabList>
              <TabsTrigger value="details">
                {t("musicInfo.tab.details")}
              </TabsTrigger>
              <TabsTrigger value="picture">
                {t("musicInfo.tab.picture")}
              </TabsTrigger>
              <TabsTrigger value="file">{t("musicInfo.tab.file")}</TabsTrigger>
            </DialogTabList>
            <DetailsPanel
              form={form}
              requireTitle={musics.length === 1}
              disabled={busy}
              candidate={candidate}
              adopted={adopted}
              onAdoptedChange={setAdoptedField}
              onFieldEdited={onFieldEdited}
            />
            <ArtworkPanel
              imageUrl={imageUrl}
              canRemove={canRemoveArtwork}
              unsupportedImageType={unsupportedImageType}
              disabled={busy}
              fetchedImageUrl={fetchedImageUrl}
              adoptPicture={adoptPicture}
              onSelectFile={selectFile}
              onRemove={removeArtwork}
              onAdoptPictureChange={setAdoptPicture}
            />
            <FilePanel musics={musics} primary={primary} />
          </Tabs>
          {fetchMessage !== null && (
            <p className="shrink-0 break-all px-4 pb-4 text-destructive text-sm">
              {t(fetchMessage.key, fetchMessage.params)}
            </p>
          )}
          {notFound && (
            <p className="shrink-0 px-4 pb-4 text-muted-foreground text-sm">
              {t("musicInfo.notFound")}
            </p>
          )}
          {error !== null && (
            <p className="shrink-0 break-all px-4 pb-4 text-destructive text-sm">
              {t("musicInfo.failed", { message: error.message })}
            </p>
          )}
          {failures.length > 0 && <ApplyFailures failures={failures} />}
        </DialogBody>
        <DialogFooter
          leading={
            <HStack className="gap-4">
              <TooltipProvider delay={600}>
                <Tooltip>
                  <TooltipTrigger
                    render={
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={!canFetch}
                        onClick={() => void fetchCandidate()}
                      />
                    }
                  >
                    {fetching ? (
                      <Loader2 className="animate-spin" />
                    ) : (
                      <CloudDownload />
                    )}
                    {t("musicInfo.fetch")}
                  </TooltipTrigger>
                  <TooltipContent side="top">
                    {t("musicInfo.fetchTooltip")}
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
              {stopsPlayback && (
                <p className="text-muted-foreground text-xs">
                  {t("musicInfo.willStopPlayback")}
                </p>
              )}
            </HStack>
          }
        >
          <Button variant="outline" disabled={applying} onClick={close}>
            {t("common.cancel")}
          </Button>
          <Button disabled={!canApply} onClick={() => void apply()}>
            {applying && <Loader2 className="animate-spin" />}
            {progress !== null
              ? `${progress.current} / ${progress.total}`
              : t("musicInfo.apply")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
