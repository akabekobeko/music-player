# electron-starter

A template project for developing new Electron applications.

## Getting Started

### Prerequisites

This project uses [mise](https://mise.jdx.dev/) to manage tool versions (Node.js, pnpm, etc.).

Install mise by following the official guide: [Getting Started - mise](https://mise.jdx.dev/getting-started.html)

### Setup

First, create a new project from this template using one of the following methods:

```sh
# Using npx
npx tiged akabeko/electron-starter my-app

# Using pnpm
pnpm dlx tiged akabeko/electron-starter my-app
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

## Scripts

| Script | Description |
| --- | --- |
| `init` | Initialize the project with your app name, ID, and license |
| `dev` | Start the development server |
| `build` | Build all processes (main, preload, renderer) |
| `typecheck` | Run TypeScript type checking |
| `package` | Build and package the app with electron-builder |
| `sync-targets` | Sync tsconfig targets with the installed Electron version |

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
- `.mise.toml` — `node` version (matching the bundled Node.js version)

If the Node.js major version changed, `mise install` installs the new version.
