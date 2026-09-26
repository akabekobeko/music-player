# Parade

[![CI](https://github.com/akabekobeko/music-player/actions/workflows/ci.yml/badge.svg)](https://github.com/akabekobeko/music-player/actions/workflows/ci.yml)

Cross-platform music player powered by Electron

## Getting Started

### Prerequisites

This project uses [mise](https://mise.jdx.dev/) to manage tool versions (Node.js, pnpm, etc.).

Install mise by following the official guide: [Getting Started - mise](https://mise.jdx.dev/getting-started.html)

### Setup

First, create a new project from this template using one of the following methods:

```sh
# Using npx
npx tiged akabekobeko/electron-starter my-app

# Using pnpm
pnpm dlx tiged akabekobeko/electron-starter my-app
```

Then install dependencies and run the interactive setup:

```sh
cd my-app
mise install
pnpm install
pnpm run init
```

`pnpm run init` interactively sets your app's package name, product name, description, app ID, and LICENSE copyright.

After setup, start the development server:

```sh
pnpm run dev
```

## File Structure

```
/
├── scripts/                     # Development tools
├── src/
│   ├── main/
│   │   ├── main.ts              # Main process entry point
│   │   └── vite.config.ts
│   ├── preload/
│   │   ├── preload.ts           # Preload script entry point
│   │   └── vite.config.ts
│   └── renderer/
│       ├── components/
│       │   ├── app/             # Application-specific components
│       │   └── ui/              # shadcn/ui components
│       ├── libs/                # Shared libraries
│       ├── App.css
│       ├── App.tsx
│       ├── index.html
│       ├── renderer.tsx         # Renderer process entry point
│       ├── vite-env.d.ts
│       └── vite.config.ts
├── biome.json
├── components.json              # shadcn/ui configuration
├── electron-builder.yml
├── tsconfig.json
├── tsconfig.node.json           # main / preload
├── tsconfig.scripts.json        # scripts (type-check only)
├── tsconfig.web.json            # renderer
└── vitest.config.ts
```

## Scripts

| Script         | Description                                                |
| -------------- | ---------------------------------------------------------- |
| `init`         | Initialize the project with your app name, ID, and license |
| `dev`          | Start the development server                               |
| `build`        | Build all processes (main, preload, renderer)              |
| `typecheck`    | Run TypeScript type checking                               |
| `package`      | Build and package the app with electron-builder            |
| `sync-targets` | Sync tsconfig targets with the installed Electron version  |
| `shadcn`       | Run the shadcn CLI against the renderer tsconfig           |

## Development userData Directory

When running in development (`pnpm run dev`), the app runs on the shared Electron binary, so Electron's `userData` path would default to a generic `Electron` directory shared by every Electron app in development. To make development use the same data (library DB, settings, artwork) as the packaged app, `src/main/main.ts` redirects `userData` to the directory named after the `productName` field in `package.json`, which is the same directory electron-builder gives the packaged app:

- macOS: `~/Library/Application Support/<productName>`
- Windows: `%APPDATA%\<productName>`
- Linux: `~/.config/<productName>`

The product name is injected into the main process at build time via Vite's `define` option (`src/main/vite.config.ts`).

Notes:

- **Production builds are not affected.** The redirect sits behind `import.meta.env.DEV`, a build-time constant: the dev script builds the main process with `NODE_ENV=development` (`true`), while `pnpm build` / `pnpm package` build with Vite's default `NODE_ENV=production` (`false`) and drop the block from the bundle entirely. See "Development-only code" below.
- A production bundle started unpackaged (`pnpm build && electron .`) therefore uses Electron's default `userData`, not the shared directory.
- Keep `productName` in `package.json` and `electron-builder.yml` identical. If they differ, development and the packaged app end up with separate directories.
- Development and the packaged app share one library DB, so running a development build with newer migrations upgrades that DB for the packaged app as well.

## Development-only Code

Diagnostics that help while developing but must not ship (request logs, `console.warn` details that the UI already reports in its own words) are wrapped in `if (import.meta.env.DEV) { ... }`. Vite replaces `import.meta.env.DEV` with a literal at build time and the bundler removes the dead branch, so the production bundle carries neither the code nor its strings. `scripts/dev.ts` builds the main and preload bundles with `NODE_ENV=development` (`true`; Vite ties `import.meta.env.DEV` to `NODE_ENV`, not to `--mode`); `pnpm build` uses Vite's default `NODE_ENV=production` (`false`); vitest runs with `true`, so tests still exercise those branches. Prefer this over a runtime check such as `app.isPackaged`, which leaves the code in the bundle.

## Adding shadcn/ui Components

shadcn/ui components live in `src/renderer/components/ui/` and use the `@/*` path alias defined in `tsconfig.web.json`. Use the `shadcn` script to add components:

```sh
pnpm shadcn add button
```

The script wraps the `shadcn` CLI with `TS_NODE_PROJECT=tsconfig.web.json` so the CLI loads the renderer's path alias from `tsconfig.web.json` instead of the root `tsconfig.json` (which only orchestrates project references). Without this, the CLI cannot resolve `@/*` and rewrites external imports such as `@base-ui/react/<name>` into broken local paths.

After the CLI finishes, the wrapper runs `biome check --write src/renderer` to format and tidy the generated files. The env var is applied via `scripts/shadcn.ts` so the script works on Windows without `cross-env`.

> **Note:** Run `pnpm shadcn ...` rather than `pnpm dlx shadcn@latest ...` so the wrapper (and the post-add formatting) is applied.

## Updating Electron

After upgrading the Electron version in `package.json`:

```sh
pnpm install
pnpm run sync-targets
mise install
```

`sync-targets` detects the Chrome and Node.js versions bundled with the installed Electron, then updates the following files:

- `tsconfig.node.json` / `tsconfig.web.json` — `target` and `module`
- `src/main/vite.config.ts` / `src/preload/vite.config.ts` — `build.target` (`node{major}`)
- `src/renderer/vite.config.ts` — `build.target` (`chrome{major}`)
- `mise.toml` — `node` version (matching the bundled Node.js version)

If the Node.js major version changed, `mise install` installs the new version.

## Updating pnpm

Node.js is pinned to the version bundled with Electron, but pnpm can be updated independently. Use `mise` to update only pnpm in `mise.toml`:

```sh
mise up --bump pnpm
```

The `--bump` flag rewrites the pinned version in `mise.toml` to the latest available release. Without it, `mise up` only upgrades within the existing range, so a fully-pinned version (e.g. `10.33.0`) is left unchanged. Add `--dry-run` to preview the change before applying it.
