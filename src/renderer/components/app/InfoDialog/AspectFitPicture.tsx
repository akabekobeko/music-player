import { Disc3, type LucideIcon } from "lucide-react";
import { type CSSProperties, useState } from "react";
import { VStack } from "@/components/app/stacks";

type Props = {
  /** Image URL, or `null` for the placeholder. */
  readonly src: string | null;
  /** Icon drawn in the placeholder; the artwork disc by default. */
  readonly placeholderIcon?: LucideIcon;
};

/**
 * Picture filling the remaining space of a tab panel, aspect-fit (kept
 * ratio, letter-boxed and centred), or a placeholder of that space.
 *
 * The rounded corners must follow the drawn picture, not a letter-boxed
 * `object-fit` box, so the `img` box is sized to the picture itself: its
 * width is the box width unless the picture would then overflow the box
 * height, in which case it is the height-derived width instead. The box is
 * a size container so `cqh` gives its height, and the picture's ratio
 * (read once it loads, square until then) comes in through a CSS variable.
 * The box is a flex item (`flex-1`), so the parent panel must be a flex
 * container for it to take the remaining space.
 */
export const AspectFitPicture = ({
  src,
  placeholderIcon: PlaceholderIcon = Disc3,
}: Props) => {
  const [ratio, setRatio] = useState<number | null>(null);
  return (
    <div className="flex min-h-0 flex-1 items-center justify-center [container-type:size]">
      {src !== null ? (
        <img
          src={src}
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
          <PlaceholderIcon
            aria-hidden
            className="size-16 text-muted-foreground"
          />
        </VStack>
      )}
    </div>
  );
};
