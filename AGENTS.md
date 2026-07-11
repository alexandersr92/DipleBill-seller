# DipleBill Seller Agent Guide

This file is the repo-level handbook for AI coding agents working in **DipleBill-seller**.

## Project Summary

DipleBill-seller is the seller-facing (cajero) POS app, split off from the main DipleBill admin repo (`../DipleBill`). It covers exactly one job: letting authenticated sellers register sales, consult invoices, receive credit payments, and manage their cash shift. All administration (products, inventories, purchases, suppliers, full credits browsing, reports, settings) lives in the admin repo, and admin settings drive several behaviors enforced here.

This is a **web app only**: React + Vite, deployed to Vercel (`vercel.json` rewrites everything to `/` for the SPA). There is **no Electron code and no thermal printing** in this repo — receipt printing uses the browser path (hidden iframe + `window.print()`) and PDF download via `html2pdf.js`. Ignore any Electron references in older docs; `LOGIC.md`'s mention of Electron is historical.

## Tech Stack

- React 18 + TypeScript + Vite (`@vitejs/plugin-react-swc`)
- Tailwind CSS + shadcn-style UI + Radix UI
- Redux Toolkit with slices and async thunks
- react-hook-form with yup validation
- Axios with Bearer token auth
- `html2pdf.js` for PDF receipt generation

## Repo Layout

- `src/modules/` feature modules: `auth`, `billing`, `clients`, `layout`, `stores`, `types`
- `src/components/` shared UI components and hooks (the live `use-toast` is `src/components/hooks/use-toast.ts`)
- `src/helpers/` shared helpers: `axiosInstance`, `authSession`, `stringSimilarity`
- `src/router/` route declarations (`index.tsx` + `routeList.ts`)
- `src/store/` Redux store and typed hooks
- `LOGIC.md` Spanish-language architecture/flow documentation for the two-step auth and POS logic
- `CLEANUP-PLAN.md` dead-code removal plan (executed 2026-07-05; kept as a record of what was removed and which lookalike files are live)

## App Surface (all of it)

- `/login` — owner/admin login (`POST /v1/login`)
- `/` and `/venta` — POS billing screen
- `/invoices`, `/invoices/:id` — invoice list and detail
- `/credits` — credit payments screen (search a credit, register an abono)
- `/caja` — cash control (shift totals, cash in/out transactions, close session)
- Everything else falls through to the 404 page

## Auth And Route Gating (critical)

`src/modules/auth/components/PrivateRoute.tsx` enforces a strict gate sequence in this order:

1. **Owner token** — `useValidateToken()` against `GET /v1/validateToken`; no token → redirect to `/login`.
2. **Seller PIN session** — if `isSellerAuthenticated` is false, render `PinLockOverlay` (store selector + seller code + PIN → `POST /v1/sellers/seller-login`). Login mode comes from the admin-configured setting `seller_login_mode` (`CODE_AND_PIN` or `PIN_ONLY`).
3. **Cash session** — if the admin setting `cash_control_mode` is `STRICT` and no cash session is open, render `CashSessionOverlay` (opening balance + register name) before allowing any page.

Consequences:

- There are two logout levels in `TopBar`: seller logout (`sellerLogout`, back to the PIN lock) and full admin logout (`performLogout`, clears everything).
- Seller identity lives in `userSlice` (`sellerId`, `sellerName`, `sellerCode`, `isSellerAuthenticated`) and is mirrored in `localStorage` (`seller_id`, `seller_name`, `seller_code`).
- Do not add routes that bypass `PrivateRoute`, and do not reorder the gate checks.

## Seller-Only Business Rules

- Sellers **can register credit sales**: in the POS, F3 toggles Contado/Crédito (requires a selected client); `ProductTable` renders the credit fields and `ConfirmSaleModal` handles `isCredit` / `invoice_expiration` / initial payment.
- Sellers **can receive credit payments** on `/credits` (`CreditPayments.tsx`): search a specific credit by client or invoice number, then pay. This is intentionally search-then-pay.
- Sellers **must NOT browse all credits**. There is no credits list module here on purpose; do not add one.
- **Owner password authorization**: annulling an invoice (invoice detail and `InvoiceListActions`) and editing an invoice require the owner's password via `OwnerPasswordConfirmDialog` → `verifyOwnerPassword`. Keep this guard on any new destructive/corrective action.
- **Duplicate-client prevention**: creating a new client from the POS runs Levenshtein similarity + generic-name checks (`src/helpers/stringSimilarity.ts`) and may open `CheckClientModal` before creating.

## Admin-Configured Settings Consumed Here

Fetched via `GET /v1/settings?key=...` (configured in the admin app's settings module):

- `seller_login_mode` — PIN lock behavior
- `cash_control_mode` — `STRICT` blocks selling without an open cash session
- `cash_assignment_mode`, `closing_count_type`, `carry_over_balance` — cash session behavior

## API And State Patterns

- Use the shared Axios instance from `src/helpers/axiosInstance.ts`; token attached as `Authorization: Bearer ...` from `localStorage`
- Redux store (`src/store/store.ts`) has exactly five slices: `userSlice`, `clientSlice`, `storeSlice`, `billingSlice`, `cashSlice`; root state resets on `userLogout` and `resetAppState`
- The admin repo's `puchaseSlice` typo does **not** exist here — do not copy it over
- `cashSlice` owns the cash session lifecycle (`fetchCashSettingsAndSession`, `openCashSession`, `closeCashSession`, `add/update/deleteCashTransaction`) and persists `active_cash_session_id` to `localStorage`
- The clients module here is headless: only `services/`, `slices/`, and `types/` are used (by the POS and the store); there is no clients management page
- Notable `localStorage` keys: `currentStoreId`, `seller_id`, `seller_name`, `seller_code`, `active_cash_session_id`, `usd_exchange_rate`

## Layout

- Layout is mobile-first: `TopBar` (store switcher, theme, dual logout) + `BottomNav` (Venta, Facturas, Créditos, Caja) in `src/modules/layout/`
- `BottomNav` uses hardcoded paths, not `routeList.ts`
- The old sidebar layout (`AppSidebar`, `components/sidebar/*`, `ui/sidebar.tsx`) was removed in the 2026-07-05 cleanup; do not reintroduce it

## Billing And Printing

- Print entry point is `src/modules/billing/helpers/print.ts`; HTML/PDF receipt generation lives in `src/modules/billing/helpers/index.ts`
- Browser-only: hidden iframe print and `html2pdf.js` download. No `window.api`, no ESC/POS
- Receipt fields must stay aligned between `InvoiceData`, the HTML template, and the payment-method formatting in `print.ts` (CASH/TRANSFER/CARD/MULTIPLE/credit)
- POS keyboard shortcuts in `src/modules/billing/containers/index.tsx`: F1 focuses product search, F2 opens the client selector, F3 toggles Contado/Crédito

## Core Conventions

- User-facing UI text stays in Spanish
- Follow `.prettierrc`: single quotes, semicolons, no trailing commas, width 100, 2 spaces
- Components use PascalCase filenames; helpers/services use camelCase; shared UI primitives use kebab-case
- Prefer existing aliases: `@` => `src`, `@modules` => `src/modules` (tsconfig also maps `@router/*`, `@store/*`, `@types/*`)
- Avoid production `console.log`; if logging is necessary, gate it with `import.meta.env.DEV`

## Styling and Design Tokens

- **Tokens only.** Use the shadcn-style HSL variables defined in `src/index.css` (e.g. `--primary`, `--muted-foreground`, `--sale-accent`) via the Tailwind aliases in `tailwind.config.js`. Do not use raw Tailwind palette classes or arbitrary color values in new code.
- **Add the token first.** If a needed color has no token, add the variable to `:root` (and `.dark`) in `src/index.css` and the alias in `tailwind.config.js` before using it. Token names are semantic (`--sale-accent`), not literal (`--green-600`).
- **State-driven theming via `data-*` attributes.** The POS sets `data-sell-type` on the form so `--sale-accent` can swap between contado/crédito palettes; components reference the token, not the state.
- **Documented exception.** `src/modules/billing/helpers/index.ts` (PDF/receipt HTML strings) renders in a detached document without access to `:root` variables and may use literal colors.
- **Migration is opportunistic.** When touching a file with raw colors, prefer migrating them to tokens; do not stop mid-feature for a sweeping refactor.

## Practical Editing Guidance

- Check for dirty git state before editing and avoid overwriting unrelated user changes
- Prefer small, localized edits over broad refactors
- The dead code from the admin-repo split was already removed (see `CLEANUP-PLAN.md`); watch for live lookalikes it calls out (`AppBadge.tsx`, `calendar.tsx`, `CalendarRangePicker.tsx`, the headless clients module) before assuming something is unused
- When changing billing, auth gating, or cash flows, re-verify the `PrivateRoute` gate sequence and the credit business rules above

## Common Commands

- `bun run dev` for Vite dev server (HTTPS via `vite-plugin-mkcert`)
- `bun run build` for typecheck (`tsc -b`) + production build
- `bun run lint` for ESLint
- `bun run format` for Prettier

## High-Risk Areas

- `src/modules/auth/components/PrivateRoute.tsx` — the entire gate sequence (token → PIN → cash session)
- `src/modules/billing/slices/cashSlice.ts` — cash session lifecycle and `active_cash_session_id` persistence
- `src/store/store.ts` — root reducer and reset behavior (both logout levels depend on it)
- `src/modules/billing/helpers/` — receipt HTML/PDF and payment-method formatting
- `src/modules/stores/` — store selection feeds `currentStoreId`, cash sessions, and every API scope
