import { afterEach, expect, it, vi } from "vitest";
import { z } from "zod";
import "./configureZod";

afterEach(() => {
  vi.unstubAllGlobals();
});

/** Count every `Function(...)` / `new Function(...)` zod attempts. */
const countFunctionCalls = (): (() => number) => {
  let calls = 0;
  vi.stubGlobal(
    "Function",
    new Proxy(Function, {
      apply: (target, thisArg, args) => {
        calls += 1;
        return Reflect.apply(target, thisArg, args);
      },
      construct: (target, args) => {
        calls += 1;
        return Reflect.construct(target, args);
      },
    }),
  );
  return () => calls;
};

it("turns zod's JIT off", () => {
  expect(z.config().jitless).toBe(true);
});

it("creates and runs object schemas without the eval probe", () => {
  // The probe is what the Renderer's CSP reports; it must not run at all.
  const calls = countFunctionCalls();

  const schema = z.object({ title: z.string() });

  expect(schema.parse({ title: "Song" })).toEqual({ title: "Song" });
  expect(schema.safeParse({ title: 1 }).success).toBe(false);
  expect(calls()).toBe(0);
});
