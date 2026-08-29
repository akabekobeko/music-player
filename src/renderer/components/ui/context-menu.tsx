import { ContextMenu as ContextMenuPrimitive } from "@base-ui/react/context-menu";
import { createContext, useContext } from "react";
import { cn } from "@/libs/utils";

/**
 * Menu appearance variants, mirroring `dropdown-menu.tsx`. "normal"
 * (default) renders native-menu-like full-width rows: the popup drops its
 * horizontal padding and rows widen their own padding instead of drawing
 * an inset rounded box, so the focus highlight spans edge to edge.
 * "basic" keeps the stock shadcn look (inset rounded rows). Set the
 * variant on `ContextMenuContent`; it flows to the rows through context.
 */
type ContextMenuVariant = "normal" | "basic";

const ContextMenuVariantContext = createContext<ContextMenuVariant>("normal");

// Metrics per variant, mirroring dropdown-menu.tsx: "normal" moves the
// popup's 4px side padding into the rows (6px -> 10px) and matches the
// vertical padding to the popup's rounded-lg radius (8px) so a highlighted
// first / last row does not clip into the rounded corners.
const contentVariantClasses: Record<ContextMenuVariant, string> = {
  normal: "py-2",
  basic: "p-1",
};

const itemVariantClasses: Record<ContextMenuVariant, string> = {
  normal: "px-2.5",
  basic: "rounded-md px-1.5",
};

// "normal" keeps the separator flush against the neighbouring rows (no
// vertical margin), matching native menus.
const separatorVariantClasses: Record<ContextMenuVariant, string> = {
  normal: "",
  basic: "-mx-1 my-1",
};

function ContextMenu({ ...props }: ContextMenuPrimitive.Root.Props) {
  return <ContextMenuPrimitive.Root data-slot="context-menu" {...props} />;
}

function ContextMenuTrigger({ ...props }: ContextMenuPrimitive.Trigger.Props) {
  return (
    <ContextMenuPrimitive.Trigger data-slot="context-menu-trigger" {...props} />
  );
}

function ContextMenuContent({
  variant = "normal",
  className,
  ...props
}: ContextMenuPrimitive.Popup.Props & {
  variant?: ContextMenuVariant;
}) {
  return (
    <ContextMenuPrimitive.Portal>
      <ContextMenuPrimitive.Positioner className="isolate z-50 outline-none">
        <ContextMenuVariantContext.Provider value={variant}>
          <ContextMenuPrimitive.Popup
            data-slot="context-menu-content"
            className={cn(
              "z-50 max-h-(--available-height) min-w-32 origin-(--transform-origin) overflow-x-hidden overflow-y-auto rounded-lg bg-popover text-popover-foreground shadow-md ring-1 ring-foreground/10 duration-100 outline-none data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95 data-closed:animate-out data-closed:overflow-hidden data-closed:fade-out-0 data-closed:zoom-out-95",
              contentVariantClasses[variant],
              className,
            )}
            {...props}
          />
        </ContextMenuVariantContext.Provider>
      </ContextMenuPrimitive.Positioner>
    </ContextMenuPrimitive.Portal>
  );
}

function ContextMenuItem({
  className,
  variant = "default",
  ...props
}: ContextMenuPrimitive.Item.Props & {
  variant?: "default" | "destructive";
}) {
  const menuVariant = useContext(ContextMenuVariantContext);
  return (
    <ContextMenuPrimitive.Item
      data-slot="context-menu-item"
      data-variant={variant}
      className={cn(
        "relative flex cursor-default items-center gap-1.5 py-1 text-sm outline-hidden select-none focus:bg-accent focus:text-accent-foreground not-data-[variant=destructive]:focus:**:text-accent-foreground data-[variant=destructive]:text-destructive data-[variant=destructive]:focus:bg-destructive/10 data-[variant=destructive]:focus:text-destructive dark:data-[variant=destructive]:focus:bg-destructive/20 data-disabled:pointer-events-none data-disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
        itemVariantClasses[menuVariant],
        className,
      )}
      {...props}
    />
  );
}

function ContextMenuSeparator({
  className,
  ...props
}: ContextMenuPrimitive.Separator.Props) {
  const menuVariant = useContext(ContextMenuVariantContext);
  return (
    <ContextMenuPrimitive.Separator
      data-slot="context-menu-separator"
      className={cn(
        "h-px bg-border",
        separatorVariantClasses[menuVariant],
        className,
      )}
      {...props}
    />
  );
}

export {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
};
