# music-player

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

## Updating pnpm

Node.js is pinned to the version bundled with Electron, but pnpm can be updated independently. Use `mise` to update only pnpm in `.mise.toml`:

```sh
mise up --bump npm:pnpm
```

The `--bump` flag rewrites the pinned version in `.mise.toml` to the latest available release. Without it, `mise up` only upgrades within the existing range, so a fully-pinned version (e.g. `10.33.0`) is left unchanged. Add `--dry-run` to preview the change before applying it.
