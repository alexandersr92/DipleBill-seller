# DipleBill Agent Guide

This file is the repo-level handbook for AI coding agents working in DipleBill.

## Project Summary

DipleBill is a POS billing and inventory app built with React, TypeScript, Vite, Redux Toolkit, and Electron. It supports browser usage and desktop thermal printing.

## Tech Stack

- React 18 + TypeScript + Vite (`@vitejs/plugin-react-swc`)
- Tailwind CSS + shadcn-style UI + Radix UI
- Redux Toolkit with slices and async thunks
- react-hook-form with yup/zod
- Axios with Bearer token auth
- Electron for desktop packaging and thermal printing
- `html2pdf.js` for PDF generation

## Repo Layout

- `src/modules/` feature modules such as `billing`, `credits`, `inventory`, `reports`, `stores`
- `src/components/` shared UI components
- `src/helpers/` shared helpers such as `axiosInstance`
- `src/router/` route declarations
- `src/store/` Redux store and typed hooks
- `src/types/` global declarations, including Electron typing
- `electron/` main process, preload, and thermal printing code

## Core Conventions

- User-facing UI text should stay in Spanish
- Follow the real repo formatter config from `.prettierrc`: single quotes, semicolons, no trailing commas, width 100, 2 spaces
- Components use PascalCase filenames
- Helpers/services use camelCase filenames
- Shared UI primitives commonly use kebab-case
- Electron code stays in `.cjs` and CommonJS format
- Prefer existing aliases: `@` => `src`, `@modules` => `src/modules`
- Avoid production `console.log`; if logging is necessary, gate it with `import.meta.env.DEV`

## Routing And App Shape

- The app currently uses `HashRouter` in `src/App.tsx`
- Most private routes are wrapped as `PrivateRoute > Layout > Page`
- Because `Layout` is instantiated per route, sidebar/layout effects can remount pages during navigation

## API And State Patterns

- Use the shared Axios instance from `src/helpers/axiosInstance.ts`
- Auth token is read from `localStorage` and attached as `Authorization: Bearer ...`
- Async flows usually live in feature `services/*Thunks.ts`
- Root state is reset on logout and on `resetAppState` in `src/store/store.ts`
- There is an intentional store key typo: `puchaseSlice` in the root reducer. Do not rename casually without a coordinated migration.

## Billing And Printing

- Billing print entry point is `src/modules/billing/helpers/print.ts`
- HTML/PDF receipt generation lives in `src/modules/billing/helpers/index.ts`
- Electron print entry points are in `electron/main.cjs`, `electron/preload.cjs`, and `electron/print/*.cjs`
- Keep renderer `InvoiceData`, HTML print helpers, and thermal printer code aligned when changing receipt fields
- Browser printing and Electron thermal printing are different paths; do not assume a fix in one path affects the other
- Thermal printer text/layout behavior is controlled separately from HTML receipt styling

## Credits Module Gotchas

- Credit detail pages fetch related invoices separately from detailed payment history
- `currentCredit` and `invoice` in `creditsSlice` are different pieces of state
- If working on credit pages, trace both `getCreditClientById` and `getCreditById`

## Reports Module Gotchas

- Reports are scoped per active store: container reads `storeId` from `state.storeSlice.store?.id` and the list `useEffect` early-returns when no store is selected
- `useGenericFilters({ storeId })` is the sole injector of `store_id` into list params; do not also include `store_id` in the `filters` memo body or it will be written twice
- Backend must accept `store_id` on `GET /v1/reports` and `POST /v1/reports`; download (`GET /v1/reports/:id/download`) and delete (`DELETE /v1/reports/:id`) identify reports by ID and do not need scoping
- Report types come from `GET /v1/reports/types` and are translated to Spanish via `reportTypeTranslations` in `src/modules/reports/types.ts`
- `downloadReport` thunk creates a blob URL and clicks a synthetic `<a download>` — works in both browser and Electron renderer (no main-process printing path involved)
- This module does not touch the thermal printer or HTML receipt code paths

## Styling and Design Tokens

- **Tokens only.** Use the shadcn-style HSL variables defined in `src/index.css` (e.g. `--primary`, `--muted-foreground`, `--ring`, `--destructive`, etc.) via the Tailwind aliases declared in `tailwind.config.js` (`bg-primary`, `text-muted-foreground`, `border-destructive`, ...). Do **not** use raw Tailwind palette classes (`bg-green-500`, `text-purple-600`, `border-amber-400`) or arbitrary color values (`bg-[#1a4ccb]`, `text-[hsl(...)]`, `ring-[rgb(...)]`) in new code.
- **Add the token first.** If a needed color does not have a token, add the variable to `:root` (and `.dark` if applicable) in `src/index.css` and the alias to `tailwind.config.js` before using it. Token names are semantic (`--sale-accent`, `--badge-success-soft`), not literal (`--green-600`).
- **State-driven theming via `data-*` attributes.** When a color must vary by component state, set the override on a parent attribute (e.g. `[data-sell-type='credito'] { --sale-accent: ... }`) and let the cascade do the work. Components reference the token, not the state.
- **Documented exceptions.** Three places are exempt from the tokens-only rule:
  - `src/modules/billing/helpers/index.ts` (PDF/receipt HTML strings — render in a detached document that has no access to `:root` variables).
  - `electron/**/*.cjs` (main process — no Tailwind, no React).
  - Third-party SVG assets where re-coloring is not viable.
- **Migration is opportunistic.** Pre-existing raw-color code (e.g. `ring-theme_blue`, `text-[#71717A]`, `text-red-500`) is being migrated phase by phase. When you touch a file, prefer to migrate the colors you encounter to tokens rather than leaving them mixed. Do not stop in the middle of a feature to do a sweeping color refactor.
- **Audit reference.** A full audit of current non-token color usage and a phased migration plan lives in `docs/superpowers/specs/2026-05-18-sale-type-clarity-design.md` (Appendix A).

## Practical Editing Guidance

- Check for dirty git state before editing and avoid overwriting unrelated user changes
- Prefer small, localized edits over broad refactors
- Preserve existing naming and data-shape conventions unless the task explicitly asks for cleanup
- When changing shared flows such as store loading, routing, billing, or printing, verify downstream consumers before finalizing

## Common Commands

- `bun run dev` for Vite dev server
- `bun run dev:electron` for Vite + Electron
- `bun run build` for typecheck + production build
- `bun run lint` for ESLint
- `bun run format` for Prettier

## High-Risk Areas

- `src/store/store.ts` root reducer and reset behavior
- `src/modules/layout/` because layout/sidebar effects can trigger remounts
- `src/modules/stores/` because store loading affects many pages
- `src/modules/billing/helpers/` and `electron/print/` because receipt fields and print flows must stay in sync
