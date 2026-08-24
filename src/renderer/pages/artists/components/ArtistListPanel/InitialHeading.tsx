import type { CSSProperties } from "react";
import { HStack } from "@/components/app/stacks";
import { useT } from "@/features/i18n/useT";
import { cn } from "@/libs/utils";
import { type Initial, OTHER_INITIAL } from "./initials";
import { INITIAL_HEADING_HEIGHT } from "./itemHeightOf";

type Props = {
  readonly initial: Initial;
  /** Extra classes (absolute positioning, translucency for the pinned copy). */
  readonly className?: string;
  readonly style?: CSSProperties;
};

/**
 * Section heading of the artist list: slimmer than an artist row, bold text
 * on a tinted background. Rendered both as an in-list row and as the pinned
 * copy at the top of the scroll area.
 */
export const InitialHeading = ({ initial, className, style }: Props) => {
  const t = useT();
  return (
    <HStack
      className={cn(
        "w-full bg-muted px-3 font-bold text-foreground text-xs",
        className,
      )}
      style={{ height: INITIAL_HEADING_HEIGHT, ...style }}
    >
      {initial === OTHER_INITIAL ? t("artist.initialOther") : initial}
    </HStack>
  );
};
