import { z } from "zod";

/**
 * Turn off zod's JIT for the Renderer (side-effect module).
 *
 * zod probes for `eval` support with `Function("")` when an object schema
 * is created. The Renderer's CSP (`script-src 'self'`) blocks the probe;
 * zod swallows the throw, but Chromium still records a CSP violation in
 * the DevTools Issues panel on every launch. Under `jitless` zod skips the
 * probe. Nothing else changes: the CSP already kept the JIT off.
 *
 * Must be the first import of the Renderer entry so it runs before any
 * module creates a schema. Main has no CSP and keeps the JIT.
 */
z.config({ jitless: true });
