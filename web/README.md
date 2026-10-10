# parade-web

The official website of Parade, published to GitHub Pages at
<https://akabekobeko.github.io/parade/>. Built with Astro and Tailwind CSS v4;
the specification is in [docs/specs/web](../docs/specs/web/README.md)
(Japanese).

This directory is a package of the root pnpm workspace. Run `pnpm install` at
the repository root once, then use the scripts below from the root with
`pnpm --filter parade-web <script>` (or `pnpm <script>` inside `web/`).

## Scripts

| Script    | Description                                                                  |
| --------- | ---------------------------------------------------------------------------- |
| `dev`     | Start the development server at `http://localhost:4321/parade/`              |
| `build`   | Build the static site into `web/dist/`                                       |
| `preview` | Serve `web/dist/` at `http://localhost:4321/parade/` (same files as Pages)   |
| `check`   | Type-check `.astro` and `.ts` files with `astro check`                       |
| `format`  | Format `.astro` files with Prettier (see below)                              |

Astro prefixes every URL with the `base` (`/parade`), so
`http://localhost:4321/` answers 404 on purpose.

## Formatting

Biome (the root configuration) formats and lints the `.ts`, `.css` and `.json`
files here, as it does for the app. It does not handle `.astro` files, so they
are formatted with Prettier and `prettier-plugin-astro` instead:

```sh
pnpm --filter parade-web format
```

The pre-commit hook (lefthook) only runs Biome, so run `format` before
committing `.astro` changes. The
[Astro VS Code extension](https://marketplace.visualstudio.com/items?itemName=astro-build.astro-vscode)
formats them on save with the same plugin.

## Tests

The few pure functions (dictionary lookup, date formatting) are tested with
the root vitest configuration, which includes `web/src/**/*.test.ts`:

```sh
pnpm vitest run web/src
```

## Notes

- `src/styles/tokens.css` is a copy of the colour tokens in
  `src/renderer/App.css`. Update it by hand when the app's palette changes.
- `web/` depends on TypeScript 6 because `astro check` does not support
  TypeScript 7 yet. It is independent of the root's TypeScript version.
