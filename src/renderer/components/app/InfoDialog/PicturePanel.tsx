import { toMediaFileUrl } from "@/libs/toMediaFileUrl";
import { AspectFitPicture } from "./AspectFitPicture";
import { DialogTabPanel } from "./DialogTabPanel";

type Props = {
  /** Tab value this panel belongs to. */
  readonly value: string;
  /** Media-file path of the artwork, or `null` for the placeholder. */
  readonly picturePath: string | null;
};

/**
 * Artwork tab of the song / album info dialogs: the picture aspect-fit in
 * the whole panel (see `AspectFitPicture`), or a placeholder.
 */
export const PicturePanel = ({ value, picturePath }: Props) => (
  <DialogTabPanel value={value} className="flex">
    <AspectFitPicture
      src={picturePath !== null ? toMediaFileUrl(picturePath) : null}
    />
  </DialogTabPanel>
);
