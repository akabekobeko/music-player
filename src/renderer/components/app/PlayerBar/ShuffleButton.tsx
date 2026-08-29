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
 * Shuffle-mode toggle right of the seek bar. While active the icon keeps
 * the primary colour with a persistent glow (the hover glow made permanent),
 * so the mode reads at a glance.
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
          "text-primary hover:text-primary [&_svg]:drop-shadow-[0_0_4px_color-mix(in_oklch,var(--primary)_70%,transparent)] hover:[&_svg]:drop-shadow-[0_0_4px_color-mix(in_oklch,var(--primary)_70%,transparent)]",
      )}
      onClick={onToggle}
    >
      <ShuffleIcon />
    </GlowIconButton>
  );
};
