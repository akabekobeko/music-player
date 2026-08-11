import { FilterX, FolderInput } from "lucide-react";
import { VStack } from "@/components/app/stacks";
import { Button } from "@/components/ui/button";
import { useT } from "@/features/i18n/useT";
import { importStore } from "@/features/import/importStore";
import { albumFilterStore } from "./albumFilterStore";

type Props = {
  /** `true` = no filter match, `false` = an entirely empty library. */
  readonly filtered: boolean;
};

/** Empty state: no filter match vs. an entirely empty library. */
export const EmptyState = ({ filtered }: Props) => {
  const t = useT();
  return (
    <VStack className="gap-4 px-6 py-16">
      <p className="text-muted-foreground text-sm">
        {filtered ? t("album.noMatch") : t("album.empty")}
      </p>
      {filtered ? (
        <Button
          variant="outline"
          size="sm"
          onClick={() => albumFilterStore.dispatch({ type: "cleared" })}
        >
          <FilterX /> {t("album.filter.clear")}
        </Button>
      ) : (
        <Button
          variant="outline"
          size="sm"
          onClick={() => void importStore.openFromDialog()}
        >
          <FolderInput /> {t("sidebar.import")}
        </Button>
      )}
    </VStack>
  );
};
