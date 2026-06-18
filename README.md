# React + TypeScript + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react/README.md) uses [Babel](https://babeljs.io/) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type aware lint rules:

- Configure the top-level `parserOptions` property like this:

```js
export default tseslint.config({
  languageOptions: {
    // other options...
    parserOptions: {
      project: ['./tsconfig.node.json', './tsconfig.app.json'],
      tsconfigRootDir: import.meta.dirname
    }
  }
});
```

- Replace `tseslint.configs.recommended` to `tseslint.configs.recommendedTypeChecked` or `tseslint.configs.strictTypeChecked`
- Optionally add `...tseslint.configs.stylisticTypeChecked`
- Install [eslint-plugin-react](https://github.com/jsx-eslint/eslint-plugin-react) and update the config:

```js
// eslint.config.js
import react from 'eslint-plugin-react';

export default tseslint.config({
  // Set the react version
  settings: { react: { version: '18.3' } },
  plugins: {
    // Add the react plugin
    react
  },
  rules: {
    // other rules...
    // Enable its recommended rules
    ...react.configs.recommended.rules,
    ...react.configs['jsx-runtime'].rules
  }
});
```

# DipleBill

Point-of-sale billing and inventory management app for small to medium businesses. Web app (Vite + React) packaged as an Electron desktop app for thermal receipt printing.

## Quick Start

```bash
bun install
bun run dev            # Vite dev server (browser)
bun run dev:electron   # Vite + Electron
bun run build          # TypeScript check + production build
bun run lint           # ESLint
bun run format         # Prettier
```

Set `VITE_API_BASE_URL` in `.env` to point at the backend. Optional Electron printing env vars: `PRINTER_INTERFACE` (e.g. `usb`, `tcp://ip:9100`), `PRINTER_LINE_WIDTH` (default `48`).

## Modules

Feature modules live under `src/modules/`:

| Module | Purpose |
|---|---|
| `auth` | Login, register, token validation |
| `billing` | POS billing, invoice list/detail, browser + thermal printing |
| `clients` | Customer management |
| `compras` | Purchases from suppliers |
| `credits` | Credit sales tracking and payments |
| `inventory` | Inventory locations + per-location products |
| `layout` | Sidebar, dashboard, 404 |
| `Organization` | Organization setup |
| `product` | Product catalog CRUD |
| `reports` | Generate, list, download (PDF), and delete server-side reports per active store |
| `settings` | Store settings |
| `stores` | Active store context (`storeSlice`) |
| `supplier` | Supplier + contacts management |
| `category`, `tag` | Categories / tags APIs |

## Conventions

- User-facing UI text is in **Spanish**.
- Formatter: `.prettierrc` — single quotes, semicolons, no trailing commas, width 100, 2-space indent.
- Components: PascalCase. Helpers/services: camelCase. shadcn primitives: kebab-case.
- Aliases: `@` → `src`, `@modules` → `src/modules`.
- No production `console.log`; gate any debug logging with `import.meta.env.DEV`.
- Electron main-process code stays in `.cjs` (CommonJS).
- Intentional load-bearing typo: the root reducer key `puchaseSlice` (do not "fix").

## Documentation

- `CLAUDE.md` — full architecture overview (tech stack, project structure, patterns, commands).
- `AGENTS.md` — agent handbook with per-module gotchas (billing/printing, credits, reports).
- `.cursor/rules/` — focused rule files for Redux state, API layer, auth, components, electron, printing, and anti-patterns.
