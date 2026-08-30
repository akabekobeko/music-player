import type * as React from "react";

import { cn } from "@/libs/utils";
import {
  type FieldVariant,
  fieldFocusClasses,
  fieldTransitionClasses,
} from "./field-variant";

/** `variant` picks the focus appearance ({@link FieldVariant}). */
function Textarea({
  className,
  variant = "normal",
  ...props
}: React.ComponentProps<"textarea"> & { readonly variant?: FieldVariant }) {
  return (
    <textarea
      data-slot="textarea"
      data-variant={variant}
      className={cn(
        "flex field-sizing-content min-h-16 w-full rounded-lg border border-input bg-transparent px-2.5 py-2 text-base outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:bg-input/50 disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 md:text-sm dark:bg-input/30 dark:disabled:bg-input/80 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40",
        fieldTransitionClasses,
        fieldFocusClasses[variant],
        className,
      )}
      {...props}
    />
  );
}

export { Textarea };
