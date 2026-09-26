import { ContextMenu as ContextMenuPrimitive } from "@base-ui/react/context-menu";
import { useContext } from "react";
import { cn } from "@/libs/utils";
import {
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuVariantContext,
} from "./dropdown-menu";

/**
 * Only the root, the trigger (right click / long press) and the
 * pointer-anchored popup are context-menu specific: Base UI's
 * `ContextMenu.Item` / `Separator` / `SubmenuRoot` / `SubmenuTrigger` are the
 * very same components as `Menu`'s, and its `Positioner` is `MenuPositioner`,
 * which anchors a submenu to its trigger. So the item and submenu parts are
 * the dropdown's, re-exported under the context-menu names below, and the
 * appearance variant ("normal" / "basic", see `dropdown-menu.tsx`) is the
 * shared context. Entries written for a dropdown thus render unchanged
 * inside a context menu.
 */

function ContextMenu({ ...props }: ContextMenuPrimitive.Root.Props) {
  return <ContextMenuPrimitive.Root data-slot="context-menu" {...props} />;
}

function ContextMenuTrigger({ ...props }: ContextMenuPrimitive.Trigger.Props) {
  return (
    <ContextMenuPrimitive.Trigger data-slot="context-menu-trigger" {...props} />
  );
}

// Metrics per variant, mirroring dropdown-menu.tsx: "normal" moves the
// popup's 4px side padding into the rows (6px -> 10px) and matches the
// vertical padding to the popup's rounded-lg radius (8px) so a highlighted
// first / last row does not clip into the rounded corners.
const contentVariantClasses = {
  normal: "py-2",
  basic: "p-1",
} as const;

function ContextMenuContent({
  variant,
  className,
  ...props
}: ContextMenuPrimitive.Popup.Props & {
  /** Omitted, the menu keeps the context default ("normal"). */
  variant?: keyof typeof contentVariantClasses;
}) {
  const inherited = useContext(DropdownMenuVariantContext);
  const resolved = variant ?? inherited;
  return (
    <ContextMenuPrimitive.Portal>
      <ContextMenuPrimitive.Positioner className="isolate z-50 outline-none">
        <DropdownMenuVariantContext.Provider value={resolved}>
          <ContextMenuPrimitive.Popup
            data-slot="context-menu-content"
            className={cn(
              "z-50 max-h-(--available-height) w-max max-w-(--available-width) min-w-32 origin-(--transform-origin) overflow-x-hidden overflow-y-auto rounded-lg bg-popover text-popover-foreground shadow-md ring-1 ring-foreground/10 duration-100 outline-none data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95 data-closed:animate-out data-closed:overflow-hidden data-closed:fade-out-0 data-closed:zoom-out-95",
              contentVariantClasses[resolved],
              className,
            )}
            {...props}
          />
        </DropdownMenuVariantContext.Provider>
      </ContextMenuPrimitive.Positioner>
    </ContextMenuPrimitive.Portal>
  );
}

const ContextMenuItem = DropdownMenuItem;
const ContextMenuSeparator = DropdownMenuSeparator;
const ContextMenuSub = DropdownMenuSub;
const ContextMenuSubTrigger = DropdownMenuSubTrigger;
const ContextMenuSubContent = DropdownMenuSubContent;

export {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuSub,
  ContextMenuSubContent,
  ContextMenuSubTrigger,
  ContextMenuTrigger,
};
