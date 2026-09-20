import type { Music } from "@mp/ipc";
import { Disc3 } from "lucide-react";
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
 */
export const PicturePanel = ({ music }: Props) => (
  <TabsContent value="picture" className={panelClassName}>
    {music.picturePath !== null ? (
      <img
        src={toMediaFileUrl(music.picturePath)}
        alt=""
        className="size-full object-contain"
      />
    ) : (
      <VStack className="size-full rounded-md bg-muted">
        <Disc3 aria-hidden className="size-16 text-muted-foreground" />
      </VStack>
    )}
  </TabsContent>
);
