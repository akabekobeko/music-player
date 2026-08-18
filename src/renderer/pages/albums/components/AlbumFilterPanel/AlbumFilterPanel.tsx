import { ChevronsDownUp, ChevronsUpDown, FilterX } from "lucide-react";
import { HStack, Stack } from "@/components/app/stacks";
import { Accordion } from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useT } from "@/features/i18n/useT";
import { FilterCheckbox } from "./FilterCheckbox";
import { FilterSection } from "./FilterSection";
import { useAlbumFilterPanel } from "./useAlbumFilterPanel";

/**
 * Album filter panel in the Sidebar's secondary area
 * (`docs/specs/v1.0/features/album-view.md`): a fixed header (text search,
 * icon-only Clear filters, expand / collapse all) above a scrolling list of
 * genre and decade checkbox sections (choices from
 * `mp:library:getFilterOptions`). The sections are accordion items that
 * open independently (all open by default, open state is view-local), each
 * with a select-all / clear-all checkbox in its heading.
 */
export const AlbumFilterPanel = () => {
  const t = useT();
  const {
    draft,
    optionsState,
    options,
    selectedGenres,
    genres,
    decades,
    canClear,
    openSections,
    setOpenSections,
    allOpen,
    allGenresSelected,
    allDecadesSelected,
    toggleAllOpen,
    setText,
    toggleGenre,
    toggleAllGenres,
    toggleDecade,
    toggleAllDecades,
    clear,
  } = useAlbumFilterPanel();

  return (
    <TooltipProvider delay={TOOLTIP_DELAY_MS}>
      <Stack className="h-full gap-0">
        <HStack className="shrink-0 p-2">
          <Input
            type="search"
            placeholder={t("album.filter.search")}
            value={draft.text ?? ""}
            onChange={(event) => setText(event.target.value)}
          />
          <Tooltip>
            <TooltipTrigger
              render={
                <Button
                  variant="outline"
                  size="icon"
                  className="shrink-0"
                  aria-label={t("album.filter.clear")}
                  disabled={!canClear}
                  onClick={clear}
                >
                  <FilterX />
                </Button>
              }
            />
            <TooltipContent side="bottom">
              {t("album.filter.clearTooltip")}
            </TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger
              render={
                <Button
                  variant="outline"
                  size="icon"
                  className="shrink-0"
                  aria-label={
                    allOpen
                      ? t("album.filter.collapseAll")
                      : t("album.filter.expandAll")
                  }
                  onClick={toggleAllOpen}
                >
                  {allOpen ? <ChevronsDownUp /> : <ChevronsUpDown />}
                </Button>
              }
            />
            <TooltipContent side="bottom">
              {t("album.filter.toggleOpenTooltip")}
            </TooltipContent>
          </Tooltip>
        </HStack>
        <Stack className="min-h-0 flex-1 gap-4 overflow-y-auto p-2 pt-0">
          {optionsState.status === "error" && (
            <p className="break-all px-1 text-destructive text-xs">
              {t("library.loadFailed", { message: optionsState.error.message })}
            </p>
          )}
          <Accordion
            multiple
            value={openSections}
            onValueChange={(value) => setOpenSections(value as string[])}
          >
            {genres.length > 0 && (
              <FilterSection
                value="genre"
                label={t("album.filter.genre")}
                allSelected={allGenresSelected}
                onToggleAll={toggleAllGenres}
              >
                {genres.map((genre) => (
                  <FilterCheckbox
                    key={genre.name}
                    label={genre.name}
                    count={genre.count}
                    checked={selectedGenres.includes(genre.name)}
                    onToggle={() => toggleGenre(genre.name)}
                  />
                ))}
              </FilterSection>
            )}
            {options !== null && (
              <FilterSection
                value="decade"
                label={t("album.filter.decade")}
                allSelected={allDecadesSelected}
                onToggleAll={toggleAllDecades}
              >
                {options.decades.map((decade) => (
                  <FilterCheckbox
                    key={decade}
                    label={`${decade}s`}
                    checked={decades.includes(decade)}
                    onToggle={() => toggleDecade(decade)}
                  />
                ))}
                <FilterCheckbox
                  label={t("album.filter.unknownYear")}
                  checked={decades.includes(null)}
                  onToggle={() => toggleDecade(null)}
                />
              </FilterSection>
            )}
          </Accordion>
        </Stack>
      </Stack>
    </TooltipProvider>
  );
};

/**
 * Delay before the tooltips show — deliberately longer than the default (an
 * instant popup is distracting while scanning the filter controls).
 */
const TOOLTIP_DELAY_MS = 1000;
