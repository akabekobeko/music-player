import type { Music } from "@mp/ipc";
import { Disc3 } from "lucide-react";
import { type CSSProperties, useState } from "react";
import { VStack } from "@/components/app/stacks";
import { TabsContent } from "@/components/ui/tabs";
import { toMediaFileUrl } from "@/libs/toMediaFileUrl";
import { panelClassName } from "./panelClassName";

type Props = {
  /** Track whose artwork is shown. */
  readonly music: Music;
};

/**
 * "Artwork" tab: the picture at the panel's full width, aspect-fit (kept
 * ratio, letter-boxed and centred inside the panel), or a placeholder.
 *
 * The rounded corners must follow the drawn picture, not a letter-boxed
 * `object-fit` box, so the `img` box is sized to the picture itself: its
 * width is the panel width unless the picture would then overflow the panel
 * height, in which case it is the height-derived width instead. The panel
 * is a size container so `cqh` gives its height, and the picture's ratio
 * (read once it loads, square until then) comes in through a CSS variable.
 */
export const PicturePanel = ({ music }: Props) => {
  const [ratio, setRatio] = useState<number | null>(null);
  return (
    <TabsContent
      value="picture"
      className={`${panelClassName} flex items-center justify-center [container-type:size]`}
    >
      {music.picturePath !== null ? (
        <img
          src={toMediaFileUrl(music.picturePath)}
          alt=""
          style={{ "--ratio": ratio ?? 1 } as CSSProperties}
          onLoad={(e) => {
            const { naturalWidth, naturalHeight } = e.currentTarget;
            if (naturalWidth > 0 && naturalHeight > 0) {
              setRatio(naturalWidth / naturalHeight);
            }
          }}
          className="w-[min(100%,calc(100cqh*var(--ratio)))] rounded-md"
        />
      ) : (
        <VStack className="size-full rounded-md bg-muted">
          <Disc3 aria-hidden className="size-16 text-muted-foreground" />
        </VStack>
      )}
    </TabsContent>
  );
};
