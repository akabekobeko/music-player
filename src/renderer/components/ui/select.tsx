import { Select as SelectPrimitive } from "@base-ui/react/select";
import { CheckIcon, ChevronDownIcon, ChevronUpIcon } from "lucide-react";
import type * as React from "react";
import { createContext, useContext } from "react";
import { cn } from "@/libs/utils";
import {
  type FieldVariant,
  fieldFocusClasses,
  fieldHoverClasses,
  fieldTransitionClasses,
} from "./field-variant";

/**
 * Popup appearance variants, mirroring `DropdownMenu`. "normal" (default)
 * renders native-menu-like full-width rows: the popup / group drop their
 * horizontal padding and rows widen their own padding instead of drawing
 * an inset rounded box, so the highlight spans edge to edge. "basic" keeps
 * the stock shadcn look (inset rounded rows). Set the variant on
 * `SelectContent`; it flows to every part through context.
 */
type SelectVariant = "normal" | "basic";

const SelectVariantContext = createContext<SelectVariant>("normal");

// Metrics per variant, matching `DropdownMenu`'s: "normal" moves the 4px
// side padding into the rows (6px -> 10px) and pads the popup vertically
// by its rounded-lg radius (8px) so a highlighted first / last row does not
// clip into the rounded corners.
const contentVariantClasses: Record<SelectVariant, string> = {
  normal: "py-2",
  basic: "",
};

const groupVariantClasses: Record<SelectVariant, string> = {
  normal: "",
  basic: "p-1",
};

const itemVariantClasses: Record<SelectVariant, string> = {
  normal: "py-1.5 pr-9 pl-2.5",
  basic: "rounded-md py-1 pr-8 pl-1.5",
};

const indicatorVariantClasses: Record<SelectVariant, string> = {
  normal: "right-3",
  basic: "right-2",
};

const labelVariantClasses: Record<SelectVariant, string> = {
  normal: "px-2.5",
  basic: "px-1.5",
};

// "normal" keeps the separator flush against the neighbouring rows (no
// vertical margin), matching native menus.
const separatorVariantClasses: Record<SelectVariant, string> = {
  normal: "",
  basic: "-mx-1 my-1",
};

const Select = SelectPrimitive.Root;

function SelectGroup({ className, ...props }: SelectPrimitive.Group.Props) {
  const variant = useContext(SelectVariantContext);
  return (
    <SelectPrimitive.Group
      data-slot="select-group"
      className={cn("scroll-my-1", groupVariantClasses[variant], className)}
      {...props}
    />
  );
}

function SelectValue({ className, ...props }: SelectPrimitive.Value.Props) {
  return (
    <SelectPrimitive.Value
      data-slot="select-value"
      className={cn("flex flex-1 text-left", className)}
      {...props}
    />
  );
}

// Stock shadcn tints the trigger on hover in dark mode; "normal" replaces
// that with the glow, so the tint stays with "basic" only.
const triggerHoverClasses: Record<FieldVariant, string> = {
  normal: fieldHoverClasses.normal,
  basic: "dark:hover:bg-input/50",
};

/** `variant` picks the hover / focus appearance ({@link FieldVariant}). */
function SelectTrigger({
  className,
  size = "default",
  variant = "normal",
  children,
  ...props
}: SelectPrimitive.Trigger.Props & {
  size?: "sm" | "default";
  readonly variant?: FieldVariant;
}) {
  return (
    <SelectPrimitive.Trigger
      data-slot="select-trigger"
      data-size={size}
      data-variant={variant}
      className={cn(
        "flex w-fit items-center justify-between gap-1.5 rounded-lg border border-input bg-transparent py-2 pr-2 pl-2.5 text-sm whitespace-nowrap outline-none select-none disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 data-placeholder:text-muted-foreground data-[size=default]:h-8 data-[size=sm]:h-7 data-[size=sm]:rounded-[min(var(--radius-md),10px)] *:data-[slot=select-value]:line-clamp-1 *:data-[slot=select-value]:flex *:data-[slot=select-value]:items-center *:data-[slot=select-value]:gap-1.5 dark:bg-input/30 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
        fieldTransitionClasses,
        triggerHoverClasses[variant],
        fieldFocusClasses[variant],
        className,
      )}
      {...props}
    >
      {children}
      <SelectPrimitive.Icon
        render={
          <ChevronDownIcon className="pointer-events-none size-4 text-muted-foreground" />
        }
      />
    </SelectPrimitive.Trigger>
  );
}

/** `variant` picks the popup appearance ({@link SelectVariant}). */
function SelectContent({
  className,
  children,
  variant = "normal",
  side = "bottom",
  sideOffset = 4,
  align = "start",
  alignOffset = 0,
  // Deviation from stock shadcn: Base UI defaults `alignItemWithTrigger` to
  // true, which overlaps the popup with the trigger so the selected item's
  // text lines up with the trigger's value (macOS NSPopUpButton style). When
  // the selected item is not the first one the popup grows upward, which
  // reads as "the menu opens above". Disable it so the list always drops
  // down below the trigger like a conventional dropdown.
  alignItemWithTrigger = false,
  ...props
}: SelectPrimitive.Popup.Props &
  Pick<
    SelectPrimitive.Positioner.Props,
    "align" | "alignOffset" | "side" | "sideOffset" | "alignItemWithTrigger"
  > & { readonly variant?: SelectVariant }) {
  return (
    <SelectPrimitive.Portal>
      <SelectPrimitive.Positioner
        side={side}
        sideOffset={sideOffset}
        align={align}
        alignOffset={alignOffset}
        alignItemWithTrigger={alignItemWithTrigger}
        className="isolate z-50"
      >
        <SelectPrimitive.Popup
          data-slot="select-content"
          data-align-trigger={alignItemWithTrigger}
          data-variant={variant}
          // Deviation from stock shadcn: `w-(--anchor-width)` clamps the
          // popup to the trigger, squeezing nowrap item text under the
          // absolutely-positioned check icon. `w-max` sizes the popup to its
          // widest item (text + reserved check area) instead; the trigger
          // width stays the minimum and the viewport the maximum.
          className={cn(
            "relative isolate z-50 max-h-(--available-height) w-max min-w-(--anchor-width) max-w-(--available-width) origin-(--transform-origin) overflow-x-hidden overflow-y-auto rounded-lg bg-popover text-popover-foreground shadow-md ring-1 ring-foreground/10 duration-100 data-[align-trigger=true]:animate-none data-[side=bottom]:slide-in-from-top-2 data-[side=inline-end]:slide-in-from-left-2 data-[side=inline-start]:slide-in-from-right-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95 data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95",
            contentVariantClasses[variant],
            className,
          )}
          {...props}
        >
          <SelectVariantContext.Provider value={variant}>
            <SelectScrollUpButton />
            <SelectPrimitive.List>{children}</SelectPrimitive.List>
            <SelectScrollDownButton />
          </SelectVariantContext.Provider>
        </SelectPrimitive.Popup>
      </SelectPrimitive.Positioner>
    </SelectPrimitive.Portal>
  );
}

function SelectLabel({
  className,
  ...props
}: SelectPrimitive.GroupLabel.Props) {
  const variant = useContext(SelectVariantContext);
  return (
    <SelectPrimitive.GroupLabel
      data-slot="select-label"
      className={cn(
        "py-1 text-xs text-muted-foreground",
        labelVariantClasses[variant],
        className,
      )}
      {...props}
    />
  );
}

function SelectItem({
  className,
  children,
  ...props
}: SelectPrimitive.Item.Props) {
  const variant = useContext(SelectVariantContext);
  return (
    <SelectPrimitive.Item
      data-slot="select-item"
      className={cn(
        "relative flex w-full cursor-default items-center gap-1.5 text-sm outline-hidden select-none focus:bg-accent focus:text-accent-foreground not-data-[variant=destructive]:focus:**:text-accent-foreground data-disabled:pointer-events-none data-disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4 *:[span]:last:flex *:[span]:last:items-center *:[span]:last:gap-2",
        itemVariantClasses[variant],
        className,
      )}
      {...props}
    >
      <SelectPrimitive.ItemText className="flex flex-1 shrink-0 gap-2 whitespace-nowrap">
        {children}
      </SelectPrimitive.ItemText>
      <SelectPrimitive.ItemIndicator
        render={
          <span
            className={cn(
              "pointer-events-none absolute flex size-4 items-center justify-center",
              indicatorVariantClasses[variant],
            )}
          />
        }
      >
        <CheckIcon className="pointer-events-none" />
      </SelectPrimitive.ItemIndicator>
    </SelectPrimitive.Item>
  );
}

function SelectSeparator({
  className,
  ...props
}: SelectPrimitive.Separator.Props) {
  const variant = useContext(SelectVariantContext);
  return (
    <SelectPrimitive.Separator
      data-slot="select-separator"
      className={cn(
        "pointer-events-none h-px bg-border",
        separatorVariantClasses[variant],
        className,
      )}
      {...props}
    />
  );
}

function SelectScrollUpButton({
  className,
  ...props
}: React.ComponentProps<typeof SelectPrimitive.ScrollUpArrow>) {
  return (
    <SelectPrimitive.ScrollUpArrow
      data-slot="select-scroll-up-button"
      className={cn(
        "top-0 z-10 flex w-full cursor-default items-center justify-center bg-popover py-1 [&_svg:not([class*='size-'])]:size-4",
        className,
      )}
      {...props}
    >
      <ChevronUpIcon />
    </SelectPrimitive.ScrollUpArrow>
  );
}

function SelectScrollDownButton({
  className,
  ...props
}: React.ComponentProps<typeof SelectPrimitive.ScrollDownArrow>) {
  return (
    <SelectPrimitive.ScrollDownArrow
      data-slot="select-scroll-down-button"
      className={cn(
        "bottom-0 z-10 flex w-full cursor-default items-center justify-center bg-popover py-1 [&_svg:not([class*='size-'])]:size-4",
        className,
      )}
      {...props}
    >
      <ChevronDownIcon />
    </SelectPrimitive.ScrollDownArrow>
  );
}

export {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectScrollDownButton,
  SelectScrollUpButton,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
  type SelectVariant,
};
