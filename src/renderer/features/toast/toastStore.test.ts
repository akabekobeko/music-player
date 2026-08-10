import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { ToastStore } from "./toastStore";

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
});

it("queues toasts with unique ids", () => {
  const store = new ToastStore();
  store.show("one");
  store.show("two");

  const toasts = store.getSnapshot();
  expect(toasts.map((toast) => toast.message)).toEqual(["one", "two"]);
  expect(toasts[0]?.id).not.toBe(toasts[1]?.id);
});

it("dismisses a toast automatically after its duration", () => {
  const store = new ToastStore();
  store.show("bye");
  vi.advanceTimersByTime(2999);
  expect(store.getSnapshot()).toHaveLength(1);

  vi.advanceTimersByTime(1);
  expect(store.getSnapshot()).toHaveLength(0);
});

it("dismisses a toast manually and ignores unknown ids", () => {
  const store = new ToastStore();
  store.show("click");
  const id = store.getSnapshot()[0]?.id as number;

  let notified = 0;
  store.subscribe(() => {
    notified += 1;
  });
  store.dismiss(id);
  expect(store.getSnapshot()).toHaveLength(0);
  expect(notified).toBe(1);

  store.dismiss(id); // Already gone — no extra notification.
  expect(notified).toBe(1);
});
