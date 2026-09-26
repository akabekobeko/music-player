import type { Music } from "@mp/ipc";
import { CloudDownload, Loader2 } from "lucide-react";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { DialogBody, DialogFooter } from "@/components/ui/dialog";
import { Tabs, TabsTrigger } from "@/components/ui/tabs";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useT } from "@/features/i18n/useT";
import { musicBrainzErrorKeyOf } from "@/features/musicbrainz/musicBrainzErrorKeyOf";
import { HStack } from "../../stacks";
import { DialogTabList } from "../DialogTabList";
import { InfoDialogHeader } from "../InfoDialogHeader";
import { ApplyFailures } from "./ApplyFailures";
import { ArtworkPanel } from "./ArtworkPanel";
import { DetailsPanel } from "./DetailsPanel";
import { FilePanel } from "./FilePanel";
import { useMusicInfoDialog } from "./useMusicInfoDialog";

/** The dialog's tabs; the session keeps the open one across tracks. */
const MUSIC_INFO_TABS = ["details", "picture", "file"] as const;

export type MusicInfoTab = (typeof MUSIC_INFO_TABS)[number];

const isMusicInfoTab = (value: unknown): value is MusicInfoTab =>
  MUSIC_INFO_TABS.some((tab) => tab === value);

/** What the popup around the content needs to know about it. */
export type MusicInfoShell = {
  /** An apply is running: Esc / backdrop must not close the dialog. */
  readonly applying: boolean;
  /** A candidate is shown: the popup widens for the two compare columns. */
  readonly wide: boolean;
};

type Props = {
  /** Tracks under edit; never empty. */
  readonly musics: readonly Music[];
  /** The first track (seeds the form and the File tab). */
  readonly primary: Music;
  /** Track the header's "previous" arrow moves to, `null` when none. */
  readonly previous: Music | null;
  /** Track the header's "next" arrow moves to, `null` when none. */
  readonly next: Music | null;
  /** The open tab, kept by the session. */
  readonly tab: MusicInfoTab;
  /** Tab switch. */
  readonly onTabChange: (tab: MusicInfoTab) => void;
  /** Reports the shell state whenever it changes. */
  readonly onShellChange: (shell: MusicInfoShell) => void;
};

/**
 * One track set of the music info dialog: the header, the three tabs and
 * the Fetch / Cancel / Apply footer inside the session's popup
 * (`MusicInfoDialogSession`). Cancel goes through the hook's `close`, which
 * refuses while an apply runs (a running fetch is simply dropped); the
 * session guards Esc / backdrop the same way from the reported shell state.
 * The session remounts this component per track set, so the form starts
 * from the right defaults every time. The popup widens once a candidate is
 * shown so the two compare columns never stack
 * (`docs/specs/v1.2/features/music-info-compare.md`).
 *
 * With a single track, the header shows the previous / next arrows; they
 * are disabled at the ends of the list the track was opened from (or when
 * it was opened without one), and hidden for a multi-track selection.
 */
export const MusicInfoDialogContent = ({
  musics,
  primary,
  previous,
  next,
  tab,
  onTabChange,
  onShellChange,
}: Props) => {
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
    showPrevious,
    showNext,
  } = useMusicInfoDialog(musics);
  const busy = applying || fetching;
  const fetchMessage =
    fetchError === null ? null : musicBrainzErrorKeyOf(fetchError);
  const wide = candidate !== null;

  // Reporting to the session, which owns the popup around this content.
  useEffect(() => {
    onShellChange({ applying, wide });
  }, [applying, wide, onShellChange]);

  return (
    <>
      <InfoDialogHeader
        title={
          musics.length === 1
            ? t("musicInfo.title")
            : t("musicInfo.titleCount", { count: musics.length })
        }
        navigation={
          musics.length === 1
            ? {
                previousLabel: t("musicInfo.previous"),
                nextLabel: t("musicInfo.next"),
                hasPrevious: previous !== null && !applying,
                hasNext: next !== null && !applying,
                onPrevious: showPrevious,
                onNext: showNext,
              }
            : undefined
        }
      />

      <DialogBody className="h-[60vh] px-0 pb-0">
        <Tabs
          value={tab}
          onValueChange={(value) => {
            if (isMusicInfoTab(value)) {
              onTabChange(value);
            }
          }}
          className="min-h-0 flex-1"
        >
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
    </>
  );
};
