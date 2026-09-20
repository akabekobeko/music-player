import { Shuffle as ShuffleIcon } from "lucide-react";
import { useT } from "@/features/i18n/useT";
import { GlowIconButton } from "../Buttons/GlowIconButton";

type Props = {
  /** Shuffle mode is on — the icon stays lit. */
  readonly active: boolean;
  readonly onToggle: () => void;
};

/**
 * Shuffle-mode toggle right of the seek bar. `GlowIconButton` renders the
 * lit state (primary colour + lamp glow) from `aria-pressed`, so the mode
 * reads at a glance without any styling here.
 */
export const ShuffleButton = ({ active, onToggle }: Props) => {
  const t = useT();
  return (
    <GlowIconButton
      aria-label={t("player.shuffle")}
      title={t("player.shuffle")}
      aria-pressed={active}
      onClick={onToggle}
    >
      <ShuffleIcon />
    </GlowIconButton>
  );
};
