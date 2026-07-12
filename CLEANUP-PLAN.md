# Dead Code Cleanup — DipleBill-seller

## Context

This repo is the seller-facing POS app, split off from the main DipleBill admin repo. Most admin modules (`inventory`, `product`, `compras`, `credits`, `reports`, `settings`, `supplier`, `Organization`, `category`, `tags`) were already removed during the split. A static import-graph trace from `src/main.tsx` (following relative imports plus the `@/`, `@modules/`, `@router/`, `@store/` aliases) found that only 94 of 140 source files are reachable. This document lists everything that is dead and should be removed, plus config fixes.

The app's live surface is: Login → Billing POS (`/` and `/venta`), invoice list (`/invoices`), invoice detail (`/invoices/:id`), credit payments (`/credits`), and cash control (`/caja`). Everything below is unreachable from those flows.

## Business requirements that MUST keep working (validated against this plan)

Sellers must be able to **register credit sales** and **receive credit payments**, but must NOT be able to browse all credits. This plan was checked against those flows:

1. **Registering credit sales** happens entirely inside the live POS: `src/modules/billing/containers/index.tsx` toggles Contado/Crédito via the F3 shortcut (requires a selected client), `ProductTable.tsx` renders the credit UI (initial payment, labels), and `ConfirmSaleModal.tsx` handles `isCredit` / `invoice_expiration`. None of these files are in the deletion list — do not touch them.
   - `SaleTypeToggle.tsx` (in the deletion list) is NOT part of this flow: it is an older standalone toggle that nothing imports; the POS replaced it with the inline F3 toggle. Safe to delete.
2. **Credit payments** are the live `/credits` route → `src/modules/billing/containers/CreditPayments.tsx` (search a specific credit, then pay). Its dependencies (`axiosInstance`, `src/components/hooks/use-toast.ts`, `button`/`input`/`label` UI, `currencyFormatter` from billing helpers) are all on the keep side. Do not touch.
3. **"See all credits" is admin-only** and the admin `credits` module does not exist in this repo. The `routeList.ts` entries `PaidCredits`, `Credit`, and `PaidCredit` scheduled for removal are dead constants with no pages behind them; removing them does not affect the `/credits` payment screen (its entry, `Credits`, stays). `BottomNav.tsx` uses hardcoded paths, not `routeList`, so navigation is unaffected.

## Rules

- Do NOT touch anything not listed here. In particular these are LIVE and must stay: `AppBadge.tsx`, `calendar.tsx`, `CalendarRangePicker.tsx`, `SearchSelect.tsx`, `Filters.tsx`, `command.tsx`, `data-table.tsx`, `src/components/hooks/use-toast.ts`, `src/modules/clients/services/`, `src/modules/clients/slices/`, `src/modules/clients/types/`, all of `src/modules/stores/slices/` and `src/modules/stores/services/`.
- Verify with a build at the end (see Verification section).
- Keep UI text in Spanish; follow `.prettierrc` (single quotes, semicolons, 2 spaces, width 100).

## 1. Delete dead files

### Register flow (router never mounts it; sellers must not self-register)

- `src/modules/auth/containers/Register.tsx`
- `src/modules/auth/components/RegisterForm.tsx`
- `src/modules/auth/components/RegisterSkeleton.tsx`
- `src/modules/auth/helpers/registerSchema.ts`

### Clients admin page (POS only uses clients services/slices, not the management UI)

- `src/modules/clients/index.tsx`
- `src/modules/clients/columns/` (entire folder)
- `src/modules/clients/components/ActionsCell.tsx`
- `src/modules/clients/components/ClientForm.tsx`
- `src/modules/clients/helpers/clientSchema.ts`

Keep `src/modules/clients/services/`, `src/modules/clients/slices/`, `src/modules/clients/types/` — they are used by `src/store/store.ts` and `src/modules/billing/containers/index.tsx`.

### Store editing UI (seller app only loads stores; it never edits them)

- `src/modules/stores/components/StoreForm.tsx`
- `src/modules/stores/helpers/countries.ts`
- `src/modules/stores/helpers/currencies.ts`
- `src/modules/stores/helpers/storeShema.ts`
- `src/types/electron.d.ts` — `StoreForm.tsx` was the only file referencing `window.api` / Electron; after deleting it this declaration file has no consumer. Double-check with a grep for `window.api` before deleting; if any live file still references it, keep it.

### Sellers module (zero consumers)

- `src/modules/sellers/` (entire folder)

### Old sidebar layout (layout now uses TopBar + BottomNav)

- `src/modules/layout/components/AppSidebar.tsx`
- `src/modules/layout/components/sidebar/` (entire folder: `nav-main.tsx`, `nav-user.tsx`)
- `src/components/ui/sidebar.tsx`
- `src/components/ui/sheet.tsx`
- `src/components/ui/separator.tsx`
- `src/components/ui/avatar.tsx`
- `src/components/ui/collapsible.tsx`
- `src/components/hooks/use-mobile.ts`

### Unused UI primitives in `src/components/ui/`

- `AppDialog.tsx`
- `AppSearchbar.tsx`
- `ImageUpload.tsx`
- `accordion.tsx`
- `badge.tsx` (note: `AppBadge.tsx` is a separate, LIVE component — do not delete it)
- `breadcrumb.tsx`
- `card.tsx`
- `context-menu.tsx`
- `date-picker.tsx` (note: `calendar.tsx` and `CalendarRangePicker.tsx` are LIVE — do not delete them)
- `form.tsx`
- `phone-input.tsx`
- `scroll-area.tsx`
- `switch.tsx`
- `tabs.tsx`
- `visually-hidden.tsx`

### Misc orphans

- `src/modules/billing/components/SaleTypeToggle.tsx`
- `src/services/baseService.ts` (delete the `src/services/` folder if it becomes empty)
- `src/store/store.types.ts`
- `src/components/hooks/useDebounce.ts`
- `src/hooks/use-toast.ts` (duplicate — the live copy is `src/components/hooks/use-toast.ts`; delete the `src/hooks/` folder if it becomes empty)

### Unreferenced assets

- `src/assets/react.svg` (delete `src/assets/` if empty)
- `public/layout/images/avatar.webp`
- `public/layout/images/dipledev_logo.png`
- `public/layout/images/logo-dark.svg`

Before deleting the public images, grep `src/` and `index.html` for `layout/images` and each filename to confirm nothing builds those URLs at runtime. As of this analysis there were zero references.

## 2. Prune `src/router/routeList.ts`

Only these route entries are used by `src/router/index.tsx`: `Home`, `Login`, `Venta`, `InvoiceList`, `Invoice`, `Credits`, `CashControl`.

Delete all other entries: `Register`, `Organization`, `PaidCredits`, `Credit`, `PaidCredit`, `Proveedores`, `Clients`, `Productos`, `Inventories`, `Inventory`, `InventoryNewProduct`, `EditInventoryProduct`, `NewProduct`, `EditProduct`, `Compra`, `Compras`, `compraItem`, `Settings`, `Setting`, `Reports`.

Grep for `routes.<Name>` across `src/` before removing each one to be safe (as of this analysis, only `src/router/index.tsx` consumes `routeList.ts`).

## 3. Remove unused dependencies from `package.json`

### dependencies (zero references in live code)

- `zod` (all validation uses yup)
- `react-select`
- `react-transition-group`
- `jspdf` (html2pdf.js declares its own jspdf dependency)
- `react-phone-number-input` (only used by the deleted `phone-input.tsx`)
- `@radix-ui/react-accordion`
- `@radix-ui/react-avatar`
- `@radix-ui/react-collapsible`
- `@radix-ui/react-context-menu`
- `@radix-ui/react-scroll-area`
- `@radix-ui/react-separator`
- `@radix-ui/react-switch`
- `@radix-ui/react-tabs`
- `@types/react-redux` (react-redux v9 ships its own types)

### devDependencies

- `sass-embedded` (there are no `.scss` files in the repo)
- `path` (bogus npm package — `vite.config.ts` uses Node's built-in `path`)

Do NOT remove: `autoprefixer`, `postcss`, `tailwindcss` (build pipeline), `vite-plugin-mkcert` (used in `vite.config.ts`), `react-day-picker`, `date-fns`, `cmdk`, `lodash`, `html2pdf.js` (all used by live code). `react-router` is technically redundant with `react-router-dom` but both are pinned to the same version; removing it is optional.

## 4. Fix `lint-staged` config in `package.json`

The current config runs scripts that do not exist and will break commits once husky runs:

```json
"lint-staged": {
  "src/**/*.{ts,tsx}": [
    "npm run test",
    "npm run prettier"
  ]
}
```

There is no `test` script and no `prettier` script (the format script is named `format`). Replace with:

```json
"lint-staged": {
  "src/**/*.{ts,tsx}": [
    "prettier --write",
    "eslint --fix"
  ]
}
```

## 5. Verification (mandatory)

1. `bun install` (or `npm install`) to refresh the lockfile after dependency removals.
2. `bun run build` — must pass. `tsc -b` runs with `noUnusedLocals`, so deleting files may surface now-unused imports in live files (e.g. an import of a deleted component); remove those imports too.
3. `bun run lint` — must pass.
4. Smoke-test `bun run dev`: log in, load the POS (`/`), open the invoice list, an invoice detail, `/credits`, and `/caja`.
5. Credit-flow smoke test (per the business requirements above): in the POS, select a client, press F3 to switch the sale to Crédito and confirm the credit fields (abono inicial, vencimiento) appear in the confirm modal; then open `/credits`, search for a credit, and confirm the payment form renders.

## Caveats

- The analysis was static import tracing; there were no string-based dynamic imports found, but the build in step 2 of the verification is the definitive check.
- The `@/modules/types` imports in billing files resolve to `src/modules/types/index.d.ts` — that file is live, keep it.
- If any deletion causes a build error because a live file imports it, prefer removing the import (if genuinely unused) over restoring the file; restore the file only if it is actually consumed at runtime.
