import { Music } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useT } from "@/features/i18n/useT";
import { HStack } from "../../stacks";
import { AspectFitPicture } from "../AspectFitPicture";
import { DialogTabPanel } from "../DialogTabPanel";

type Props = {
  /** Artwork to show (current one, or the preview of a picked file). */
  readonly imageUrl: string | null;
  /** Whether Remove has anything to remove or undo. */
  readonly canRemove: boolean;
  /** MIME type (or name) of a rejected pick, shown as an error. */
  readonly unsupportedImageType: string | null;
  /** Inputs are locked while an apply runs. */
  readonly disabled: boolean;
  /** Called with the image file the user picked. */
  readonly onSelectFile: (file: File) => void;
  /** Called when the user asks to remove the artwork / undo the pick. */
  readonly onRemove: () => void;
};

/**
 * "Artwork" tab (`docs/specs/v1.1/features/artwork-edit.md`): the current
 * (or previewed) front cover aspect-fit above the file picker and the
 * Remove button. Kept mounted while another tab is shown so the native
 * file input keeps showing the picked file name until the dialog closes.
 */
export const ArtworkPanel = ({
  imageUrl,
  canRemove,
  unsupportedImageType,
  disabled,
  onSelectFile,
  onRemove,
}: Props) => {
  const t = useT();
  return (
    <DialogTabPanel value="picture" keepMounted className="flex flex-col gap-4">
      <AspectFitPicture src={imageUrl} placeholderIcon={Music} />
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
      {unsupportedImageType !== null && (
        <p className="shrink-0 text-destructive text-xs">
          {t("musicInfo.unsupportedImage", { type: unsupportedImageType })}
        </p>
      )}
    </DialogTabPanel>
  );
};
