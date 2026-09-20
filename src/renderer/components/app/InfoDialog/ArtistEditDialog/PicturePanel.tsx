import { UserRound } from "lucide-react";
import { AspectFitPicture } from "@/components/app/InfoDialog/AspectFitPicture";
import { DialogTabPanel } from "@/components/app/InfoDialog/DialogTabPanel";
import { Input } from "@/components/ui/input";
import { useT } from "@/features/i18n/useT";

type Props = {
  /** Picture to show (current one, or the preview of a picked file). */
  readonly imageUrl: string | null;
  /** Called with the image file the user picked. */
  readonly onSelectFile: (file: File) => void;
};

/**
 * "Picture" tab: the current (or previewed) picture aspect-fit in the space
 * above the file picker, the same treatment as the song / album artwork
 * tabs. Kept mounted while another tab is shown so the native file input
 * keeps showing the picked file name until the dialog closes.
 */
export const PicturePanel = ({ imageUrl, onSelectFile }: Props) => {
  const t = useT();
  return (
    <DialogTabPanel value="picture" keepMounted className="flex flex-col gap-4">
      <AspectFitPicture src={imageUrl} placeholderIcon={UserRound} />
      <Input
        type="file"
        accept="image/*"
        aria-label={t("artistEdit.imageFile")}
        className="shrink-0"
        onChange={(event) => {
          const picked = event.target.files?.[0];
          if (picked !== undefined) {
            onSelectFile(picked);
          }
        }}
      />
    </DialogTabPanel>
  );
};
