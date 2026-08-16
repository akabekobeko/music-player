import { FilterX } from "lucide-react";
import { Stack } from "@/components/app/stacks";
import { Accordion } from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useT } from "@/features/i18n/useT";
import { FilterCheckbox } from "./FilterCheckbox";
import { FilterSection } from "./FilterSection";
import { useAlbumFilterPanel } from "./useAlbumFilterPanel";

/**
 * Album filter panel in the Sidebar's secondary area
 * (`docs/specs/v1.0/features/album-view.md`): text search, genre and decade
 * checkboxes (choices from `mp:library:getFilterOptions`), and Clear filters.
 * The genre / decade sections are accordion items (both open by default,
 * open state is view-local).
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
    setText,
    toggleGenre,
    toggleDecade,
    clear,
  } = useAlbumFilterPanel();

  return (
    <Stack className="h-full gap-4 overflow-y-auto p-2">
      <Input
        type="search"
        placeholder={t("album.filter.search")}
        value={draft.text ?? ""}
        onChange={(event) => setText(event.target.value)}
      />
      {optionsState.status === "error" && (
        <p className="break-all px-1 text-destructive text-xs">
          {t("library.loadFailed", { message: optionsState.error.message })}
        </p>
      )}
      <Accordion defaultValue={["genre", "decade"]}>
        {genres.length > 0 && (
          <FilterSection value="genre" label={t("album.filter.genre")}>
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
          <FilterSection value="decade" label={t("album.filter.decade")}>
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
      <Button
        variant="outline"
        size="sm"
        className="shrink-0"
        disabled={!canClear}
        onClick={clear}
      >
        <FilterX /> {t("album.filter.clear")}
      </Button>
    </Stack>
  );
};
