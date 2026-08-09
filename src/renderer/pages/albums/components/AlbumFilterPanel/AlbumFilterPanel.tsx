import type { FilterOptions } from "@mp/ipc";
import { FilterX } from "lucide-react";
import { type ReactNode, useSyncExternalStore } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { useT } from "@/features/i18n/useT";
import { queryKeys } from "@/features/library/queryStore";
import { useLibraryQuery } from "@/features/library/useLibraryQuery";
import { albumFilterStore, hasActiveFilter } from "../../albumFilterStore";
import { decadeOptions } from "./decadeOptions";

/**
 * Album filter panel in the Sidebar's secondary area
 * (`docs/specs/v1.0/features/album-view.md`): text search, genre and decade
 * checkboxes (choices from `mp:library:getFilterOptions`), and Clear filters.
 * Controls only dispatch to the shared filter store — the albums page reads
 * the applied filter from the same store for its query key.
 */
export const AlbumFilterPanel = () => {
  const t = useT();
  const { draft } = useSyncExternalStore(
    albumFilterStore.subscribe,
    albumFilterStore.getSnapshot,
  );
  const optionsState = useLibraryQuery<FilterOptions>(queryKeys.filterOptions);
  const options = optionsState.status === "success" ? optionsState.value : null;

  // Persisted genres that no longer exist in the library (e.g. after a
  // remove) stay visible as checked zero-count items instead of filtering
  // invisibly.
  const selectedGenres = draft.genres ?? [];
  const genres = [
    ...(options?.genres ?? []),
    ...selectedGenres
      .filter((name) => !options?.genres.some((genre) => genre.name === name))
      .map((name) => ({ name, count: 0 })),
  ];
  const decades = draft.decades ?? [];

  return (
    <div className="flex h-full flex-col gap-3 overflow-y-auto p-2">
      <Input
        type="search"
        placeholder={t("album.filter.search")}
        value={draft.text ?? ""}
        onChange={(event) => {
          albumFilterStore.dispatch({
            type: "textChanged",
            text: event.target.value,
          });
        }}
      />
      {optionsState.status === "error" && (
        <p className="break-all px-1 text-destructive text-xs">
          {t("library.loadFailed", { message: optionsState.error.message })}
        </p>
      )}
      {genres.length > 0 && (
        <FilterSection label={t("album.filter.genre")}>
          {genres.map((genre) => (
            <FilterCheckbox
              key={genre.name}
              label={genre.name}
              count={genre.count}
              checked={selectedGenres.includes(genre.name)}
              onToggle={() => {
                albumFilterStore.dispatch({
                  type: "genreToggled",
                  genre: genre.name,
                });
              }}
            />
          ))}
        </FilterSection>
      )}
      {options !== null && (
        <FilterSection label={t("album.filter.decade")}>
          {decadeOptions(options.yearRange).map((decade) => (
            <FilterCheckbox
              key={decade}
              label={`${decade}s`}
              checked={decades.includes(decade)}
              onToggle={() => {
                albumFilterStore.dispatch({ type: "decadeToggled", decade });
              }}
            />
          ))}
          <FilterCheckbox
            label={t("album.filter.unknownYear")}
            checked={decades.includes(null)}
            onToggle={() => {
              albumFilterStore.dispatch({
                type: "decadeToggled",
                decade: null,
              });
            }}
          />
        </FilterSection>
      )}
      <Button
        variant="outline"
        size="sm"
        className="shrink-0"
        disabled={!hasActiveFilter(draft)}
        onClick={() => albumFilterStore.dispatch({ type: "cleared" })}
      >
        <FilterX /> {t("album.filter.clear")}
      </Button>
    </div>
  );
};

/** Heading + checkbox list of one filter kind. */
const FilterSection = ({
  label,
  children,
}: {
  readonly label: string;
  readonly children: ReactNode;
}) => (
  <section className="shrink-0">
    <h3 className="px-1 pb-1 font-medium text-muted-foreground text-xs">
      {label}
    </h3>
    <div className="flex flex-col gap-0.5">{children}</div>
  </section>
);

/** One checkbox row; the whole row is the click target. */
const FilterCheckbox = ({
  label,
  count,
  checked,
  onToggle,
}: {
  readonly label: string;
  /** Album count badge; omitted for decade items. */
  readonly count?: number;
  readonly checked: boolean;
  readonly onToggle: () => void;
}) => (
  // biome-ignore lint/a11y/noLabelWithoutControl: Base UI's Checkbox renders a hidden native input inside the label, which the lint cannot see.
  <label className="flex cursor-default items-center gap-2 rounded-md px-1 py-1 text-sm hover:bg-sidebar-accent/50">
    <Checkbox checked={checked} onCheckedChange={onToggle} />
    <span className="min-w-0 flex-1 truncate">{label}</span>
    {count !== undefined && (
      <span className="shrink-0 text-muted-foreground text-xs tabular-nums">
        {count}
      </span>
    )}
  </label>
);
