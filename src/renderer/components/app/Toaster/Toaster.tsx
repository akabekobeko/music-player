import { useSyncExternalStore } from "react";
import { Stack } from "@/components/app/stacks";
import { toastStore } from "@/features/toast/toastStore";

/**
 * Toast overlay, mounted once in the AppLayout. Renders the store's queue
 * bottom-right above the content (and clear of the bottom PlayerBar band);
 * a click dismisses early.
 */
export const Toaster = () => {
  const toasts = useSyncExternalStore(
    toastStore.subscribe,
    toastStore.getSnapshot,
  );
  return (
    <Stack className="pointer-events-none fixed right-4 bottom-[calc(var(--playerbar-height)+1rem)] z-50 items-end">
      {toasts.map((toast) => (
        <button
          key={toast.id}
          type="button"
          className="pointer-events-auto max-w-xs break-all rounded-md border bg-popover px-3 py-2 text-left text-popover-foreground text-sm shadow-md"
          onClick={() => toastStore.dismiss(toast.id)}
        >
          {toast.message}
        </button>
      ))}
    </Stack>
  );
};
