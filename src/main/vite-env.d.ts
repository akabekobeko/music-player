/**
 * Vite `?raw` imports used by the Main process (migration SQL files).
 * Both Vite and vitest resolve these natively; this declaration only informs
 * `tsc`.
 */
declare module "*.sql?raw" {
  const content: string;
  export default content;
}
