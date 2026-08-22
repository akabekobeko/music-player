import { Input as InputPrimitive } from "@base-ui/react/input";
import type * as React from "react";

import { cn } from "@/libs/utils";

/**
 * Whether the keydown is the Enter that confirms an IME composition (Japanese
 * etc.). Such Enter must never count as "submit"; `keyCode` 229 covers the
 * engines that report the composition Enter without `isComposing`.
 */
export const isImeConfirmEnter = (event: {
  readonly key: string;
  readonly keyCode?: number;
  readonly nativeEvent: { readonly isComposing?: boolean };
}): boolean =>
  event.key === "Enter" &&
  (event.nativeEvent.isComposing === true || event.keyCode === 229);

/**
 * `input` that swallows the IME-confirming Enter so callers' `onKeyDown`
 * handlers only ever see a "real" Enter.
 */
function Input({
  className,
  type,
  onKeyDown,
  ...props
}: React.ComponentProps<"input">) {
  return (
    <InputPrimitive
      type={type}
      data-slot="input"
      className={cn(
        "h-8 w-full min-w-0 rounded-lg border border-input bg-transparent px-2.5 py-1 text-base transition-colors outline-none file:inline-flex file:h-6 file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:cursor-not-allowed disabled:bg-input/50 disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 md:text-sm dark:bg-input/30 dark:disabled:bg-input/80 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40",
        className,
      )}
      onKeyDown={(event) => {
        if (isImeConfirmEnter(event)) {
          return;
        }
        onKeyDown?.(event);
      }}
      {...props}
    />
  );
}

export { Input };
