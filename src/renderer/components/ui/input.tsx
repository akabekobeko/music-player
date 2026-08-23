import { Input as InputPrimitive } from "@base-ui/react/input";
import * as React from "react";

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
 * `input` that is IME-aware on behalf of its callers:
 * - swallows the IME-confirming Enter so `onKeyDown` only ever sees a "real"
 *   Enter;
 * - holds `onChange` back while a composition (Japanese etc.) is in progress
 *   and fires it once with the confirmed text, so filters and validations
 *   never run on half-converted input. Without an IME nothing changes: every
 *   keystroke reaches `onChange` as usual.
 *
 * A controlled `value` keeps showing the in-progress text through a local
 * draft while composing — otherwise React would snap the DOM back to the
 * unchanged prop and break the composition.
 */
function Input({
  className,
  type,
  value,
  onChange,
  onCompositionStart,
  onCompositionEnd,
  onKeyDown,
  ...props
}: React.ComponentProps<"input">) {
  /** Text typed so far during a composition; `null` while not composing. */
  const [draft, setDraft] = React.useState<string | null>(null);
  const composing = draft !== null;

  return (
    <InputPrimitive
      type={type}
      value={value !== undefined && composing ? draft : value}
      data-slot="input"
      className={cn(
        "h-8 w-full min-w-0 rounded-lg border border-input bg-transparent px-2.5 py-1 text-base transition-colors outline-none file:inline-flex file:h-6 file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:cursor-not-allowed disabled:bg-input/50 disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 md:text-sm dark:bg-input/30 dark:disabled:bg-input/80 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40",
        className,
      )}
      onChange={(event) => {
        if (composing) {
          setDraft(event.target.value);
          return;
        }
        onChange?.(event);
      }}
      onCompositionStart={(event) => {
        setDraft(event.currentTarget.value);
        onCompositionStart?.(event);
      }}
      onCompositionEnd={(event) => {
        setDraft(null);
        onCompositionEnd?.(event);
        // The confirmed text is the one real change of the whole composition.
        // Browsers disagree on whether the last `input` event precedes or
        // follows `compositionend`; the event's target is the same input, so
        // callers reading `event.target.value` see the final text either way.
        onChange?.(event as unknown as React.ChangeEvent<HTMLInputElement>);
      }}
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
