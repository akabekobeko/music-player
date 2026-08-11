import { FilterX } from "lucide-react";
import type { ReactNode } from "react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { useT } from "@/features/i18n/useT";
import { decadeOptions } from "./decadeOptions";
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
    <div className="flex h-full flex-col gap-3 overflow-y-auto p-2">
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
            {decadeOptions(options.yearRange).map((decade) => (
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
    </div>
  );
};

/** Collapsible heading + checkbox list of one filter kind. */
const FilterSection = ({
  value,
  label,
  children,
}: {
  /** Accordion item value (identifies the section's open state). */
  readonly value: string;
  readonly label: string;
  readonly children: ReactNode;
}) => (
  <AccordionItem value={value}>
    <AccordionTrigger className="px-1 py-2 text-muted-foreground text-xs hover:no-underline">
      {label}
    </AccordionTrigger>
    <AccordionContent className="flex flex-col gap-0.5 pb-2">
      {children}
    </AccordionContent>
  </AccordionItem>
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
