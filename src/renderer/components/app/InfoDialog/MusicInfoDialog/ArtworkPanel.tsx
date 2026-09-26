import { Music } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { useT } from "@/features/i18n/useT";
import { cn } from "@/libs/utils";
import { HStack, Spacer, Stack } from "../../stacks";
import { AspectFitPicture } from "../AspectFitPicture";
import { DialogTabPanel } from "../DialogTabPanel";
import { ADOPT_FRAME_CLASSES } from "./adoptClasses";

type Props = {
  /** Artwork to show (current one, or the preview of a picked file). */
  readonly imageUrl: string | null;
  /** Whether Remove has anything to remove or undo. */
  readonly canRemove: boolean;
  /** MIME type (or name) of a rejected pick, shown as an error. */
  readonly unsupportedImageType: string | null;
  /** Inputs are locked while an apply or a fetch runs. */
  readonly disabled: boolean;
  /**
   * The fetched cover as a `data:` URL, or `null` when there is no
   * candidate or it has no cover (the tab then shows the v1.1 layout).
   */
  readonly fetchedImageUrl: string | null;
  /** Whether the fetched cover is the one that will be saved. */
  readonly adoptPicture: boolean;
  /** Called with the image file the user picked. */
  readonly onSelectFile: (file: File) => void;
  /** Called when the user asks to remove the artwork / undo the pick. */
  readonly onRemove: () => void;
  /** Called when the "use this one" checkbox is toggled. */
  readonly onAdoptPictureChange: (adopted: boolean) => void;
};

/**
 * "Artwork" tab (`docs/specs/v1.1/features/artwork-edit.md`): the current
 * (or previewed) front cover aspect-fit above the file picker and the
 * Remove button. Kept mounted while another tab is shown so the native
 * file input keeps showing the picked file name until the dialog closes.
 *
 * With a fetched cover (`docs/specs/v1.2/features/artwork-compare.md`)
 * the tab splits in two: the current side on the left, the fetched cover
 * with its adopt checkbox on the right, and the frame of the side that
 * will be saved carries the adopt border. Neither picture moves when the
 * choice changes; only the frames do.
 */
export const ArtworkPanel = ({
  imageUrl,
  canRemove,
  unsupportedImageType,
  disabled,
  fetchedImageUrl,
  adoptPicture,
  onSelectFile,
  onRemove,
  onAdoptPictureChange,
}: Props) => {
  const t = useT();
  const compare = fetchedImageUrl !== null;
  const picture = (
    <Frame adopted={compare && !adoptPicture}>
      <AspectFitPicture src={imageUrl} placeholderIcon={Music} />
    </Frame>
  );
  const controls = (
    <HStack className="shrink-0">
      <Input
        type="file"
        accept="image/*"
        aria-label={t("musicInfo.imageFile")}
        disabled={disabled}
        onChange={(event) => {
          const picked = event.target.files?.[0];
          if (picked !== undefined) {
            onSelectFile(picked);
          }
        }}
      />
      <Button
        variant="outline"
        disabled={disabled || !canRemove}
        onClick={onRemove}
      >
        {t("musicInfo.removeArtwork")}
      </Button>
    </HStack>
  );
  return (
    <DialogTabPanel value="picture" keepMounted className="flex flex-col gap-4">
      {compare ? (
        <HStack className="min-h-0 flex-1 items-stretch gap-4">
          <Stack className="min-h-0 flex-1 gap-4">
            {picture}
            {controls}
          </Stack>
          <Stack className="min-h-0 flex-1 gap-4">
            <Frame adopted={adoptPicture}>
              <AspectFitPicture src={fetchedImageUrl} placeholderIcon={Music} />
            </Frame>
            <HStack className="h-8 shrink-0">
              <Spacer />
              {/* The checkbox is a button (Base UI), so a label cannot bind
                  to it; the visible text is decoration and the accessible
                  name lives on the checkbox itself. */}
              <HStack className="gap-2 text-sm">
                <Checkbox
                  checked={adoptPicture}
                  disabled={disabled}
                  aria-label={t("musicInfo.adoptFetched")}
                  onCheckedChange={(checked) =>
                    onAdoptPictureChange(checked === true)
                  }
                />
                <span aria-hidden>{t("musicInfo.adoptFetched")}</span>
              </HStack>
            </HStack>
          </Stack>
        </HStack>
      ) : (
        <>
          {picture}
          {controls}
        </>
      )}
      {unsupportedImageType !== null && (
        <p className="shrink-0 text-destructive text-xs">
          {t("musicInfo.unsupportedImage", { type: unsupportedImageType })}
        </p>
      )}
    </DialogTabPanel>
  );
};

type FrameProps = {
  /** Whether this side will be saved (adopt border), else transparent. */
  readonly adopted: boolean;
  /** The aspect-fit picture. */
  readonly children: React.ReactNode;
};

/** Picture frame whose border tells which side an apply would save. */
const Frame = ({ adopted, children }: FrameProps) => (
  <div
    className={cn(
      "flex min-h-0 flex-1 rounded-lg border-2 p-1 transition-[border-color] duration-200",
      adopted ? ADOPT_FRAME_CLASSES : "border-transparent",
    )}
  >
    {children}
  </div>
);
