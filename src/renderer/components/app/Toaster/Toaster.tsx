import { useSyncExternalStore } from "react";
import { Stack } from "@/components/app/stacks";
import { toastStore } from "@/features/toast/toastStore";

/**
 * Toast overlay, mounted once in the AppLayout. Renders the store's queue
 * bottom-right above the content; a click dismisses early.
 */
export const Toaster = () => {
  const toasts = useSyncExternalStore(
    toastStore.subscribe,
    toastStore.getSnapshot,
  );
  return (
    <Stack className="pointer-events-none fixed right-4 bottom-4 z-50 items-end">
      {toasts.map((toast) => (
        <button
          key={toast.id}
          type="button"
          className="pointer-events-auto max-w-xs truncate rounded-md border bg-popover px-3 py-2 text-left text-popover-foreground text-sm shadow-md"
          onClick={() => toastStore.dismiss(toast.id)}
        >
          {toast.message}
        </button>
      ))}
    </Stack>
  );
};
