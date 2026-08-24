import { HStack, Stack } from "@/components/app/stacks";
import { Input } from "@/components/ui/input";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useT } from "@/features/i18n/useT";
import { ArtistListRows } from "./ArtistListRows";
import { InitialPicker } from "./InitialPicker";
import { useArtistListPanel } from "./useArtistListPanel";

/** Delay before the header tooltip shows — long, the icon is self-explanatory once learnt. */
const TOOLTIP_DELAY_MS = 1000;

/**
 * Artist list in the Sidebar's secondary area
 * (`docs/specs/v1.0/features/artist-view.md`): a fixed header (name filter,
 * initial picker), article-blind sort grouped under A–Z / "Other" headings,
 * virtual scrolling with a pinned section heading, and route-driven
 * selection — the URL (`/artists/name/:artistName`, `/artists/unknown` for
 * the empty-name bucket) is the single source of the selected artist (no
 * Context state like audio-player's `artistTab`).
 */
export const ArtistListPanel = () => {
  const t = useT();
  const {
    artistsState,
    sections,
    availableInitials,
    selectedName,
    query,
    setQuery,
    rowsRef,
    jumpToInitial,
  } = useArtistListPanel();

  return (
    <Stack className="h-full gap-0">
      <TooltipProvider delay={TOOLTIP_DELAY_MS}>
        <HStack className="shrink-0 p-2">
          <Input
            type="search"
            placeholder={t("artist.search")}
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
          <InitialPicker
            available={availableInitials}
            onSelect={jumpToInitial}
          />
        </HStack>
      </TooltipProvider>
      {artistsState.status === "error" && (
        <p className="break-all px-3 py-2 text-destructive text-xs">
          {t("library.loadFailed", { message: artistsState.error.message })}
        </p>
      )}
      {artistsState.status === "success" && sections.length === 0 && (
        <p className="px-3 py-2 text-muted-foreground text-xs">
          {t("artist.empty")}
        </p>
      )}
      {artistsState.status === "success" && (
        <ArtistListRows
          ref={rowsRef}
          sections={sections}
          selectedName={selectedName}
        />
      )}
    </Stack>
  );
};
