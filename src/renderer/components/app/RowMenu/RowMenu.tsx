import { MoreHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

/**
 * The [⋯] dropdown shared by list headers, album sections, and track rows
 * (Artist / Album views). Promoted out of the Artist page when the Album
 * view became its second consumer.
 */
export const RowMenu = ({
  items,
}: {
  readonly items: ReadonlyArray<{
    readonly label: string;
    readonly onSelect?: () => void;
    readonly disabled?: boolean;
    readonly destructive?: boolean;
    readonly separatorBefore?: boolean;
  }>;
}) => (
  <DropdownMenu>
    <DropdownMenuTrigger
      render={<Button variant="ghost" size="icon-sm" aria-label="Menu" />}
    >
      <MoreHorizontal />
    </DropdownMenuTrigger>
    <DropdownMenuContent align="end">
      {items.map((item) => (
        <div key={item.label}>
          {item.separatorBefore === true && <DropdownMenuSeparator />}
          <DropdownMenuItem
            disabled={item.disabled}
            variant={item.destructive === true ? "destructive" : "default"}
            onClick={item.onSelect}
          >
            {item.label}
          </DropdownMenuItem>
        </div>
      ))}
    </DropdownMenuContent>
  </DropdownMenu>
);
