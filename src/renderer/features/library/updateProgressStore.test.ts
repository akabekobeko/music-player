import type { UpdateProgressPayload } from "@mp/ipc";
import { expect, it } from "vitest";
import { UpdateProgressStore } from "./updateProgressStore";

/** Fake push channel: records attach / detach and lets the test push. */
const channel = () => {
  let push: ((payload: UpdateProgressPayload) => void) | null = null;
  let attached = 0;
  return {
    attach: (listener: (payload: UpdateProgressPayload) => void) => {
      push = listener;
      attached += 1;
      return () => {
        push = null;
      };
    },
    push: (payload: UpdateProgressPayload) => push?.(payload),
    get isAttached() {
      return push !== null;
    },
    get attachedCount() {
      return attached;
    },
  };
};

const payload = (current: number): UpdateProgressPayload => ({
  current,
  total: 3,
  filePath: `/m/${current}.mp3`,
});

it("starts empty and exposes the latest push to subscribers", () => {
  const ipc = channel();
  const store = new UpdateProgressStore(ipc.attach);
  expect(store.getSnapshot()).toBeNull();

  let notified = 0;
  store.subscribe(() => {
    notified += 1;
  });
  ipc.push(payload(1));
  ipc.push(payload(2));

  expect(store.getSnapshot()).toEqual(payload(2));
  expect(notified).toBe(2);
});

it("attaches to the channel with the first subscriber and detaches with the last", () => {
  const ipc = channel();
  const store = new UpdateProgressStore(ipc.attach);
  expect(ipc.isAttached).toBe(false);

  const unsubscribeA = store.subscribe(() => {});
  const unsubscribeB = store.subscribe(() => {});
  expect(ipc.isAttached).toBe(true);
  expect(ipc.attachedCount).toBe(1);

  unsubscribeA();
  expect(ipc.isAttached).toBe(true);
  unsubscribeB();
  expect(ipc.isAttached).toBe(false);

  store.subscribe(() => {});
  expect(ipc.attachedCount).toBe(2);
});

it("reset forgets the previous run and notifies once", () => {
  const ipc = channel();
  const store = new UpdateProgressStore(ipc.attach);
  let notified = 0;
  store.subscribe(() => {
    notified += 1;
  });
  ipc.push(payload(3));
  notified = 0;

  store.reset();
  expect(store.getSnapshot()).toBeNull();
  expect(notified).toBe(1);

  store.reset();
  expect(notified).toBe(1);
});
