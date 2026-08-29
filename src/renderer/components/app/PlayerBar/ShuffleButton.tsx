import { Shuffle as ShuffleIcon } from "lucide-react";
import { GlowIconButton } from "@/components/app/Buttons/GlowIconButton";
import { useT } from "@/features/i18n/useT";
import { cn } from "@/libs/utils";

type Props = {
  /** Shuffle mode is on — the icon stays lit. */
  readonly active: boolean;
  readonly onToggle: () => void;
};

/**
 * Shuffle-mode toggle right of the seek bar. While active the icon turns
 * primary and glows like a lamp: a mid bloom plus a wide faint halo. No
 * shadow hugs the outline — a tight layer fuzzes the glyph's edge — so the
 * lines stay crisp inside the bloom. The `!` keeps this filter over
 * `GlowIconButton`'s foreground hover glow.
 */
export const ShuffleButton = ({ active, onToggle }: Props) => {
  const t = useT();
  return (
    <GlowIconButton
      aria-label={t("player.shuffle")}
      title={t("player.shuffle")}
      aria-pressed={active}
      className={cn(
        active &&
          "text-primary hover:text-primary [&_svg]:filter-[drop-shadow(0_0_5px_var(--primary))_drop-shadow(0_0_12px_color-mix(in_oklch,var(--primary)_60%,transparent))]!",
      )}
      onClick={onToggle}
    >
      <ShuffleIcon />
    </GlowIconButton>
  );
};
