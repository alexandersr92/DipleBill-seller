# DipleBill Seller — Project Overview

## Description

DipleBill-seller is the **seller-facing (cajero) point-of-sale app**, split off from the main DipleBill admin repo (`../DipleBill`). It lets authenticated sellers register sales (contado and crédito), consult invoices, receive credit payments, and manage their cash shift. All administration (products, inventories, purchases, suppliers, full credits browsing, reports, settings) lives in the admin repo; admin-configured settings drive several behaviors enforced here.

This is a **web app only** — React + Vite deployed to Vercel. There is no Electron code and no thermal printing in this repo: receipt printing uses a hidden iframe + `window.print()`, and PDF download uses `html2pdf.js`.

---

## Tech Stack

| Layer       | Technology                                      |
| ----------- | ----------------------------------------------- |
| Frontend    | React 18, TypeScript, Vite (SWC)                |
| Styling     | Tailwind CSS, shadcn/ui, Radix UI, lucide-react |
| State       | Redux Toolkit (slices + thunks)                 |
| Forms       | react-hook-form, yup                            |
| Routing     | react-router-dom v6 (`HashRouter`)              |
| HTTP        | Axios (intercepted with Bearer token)           |
| PDF         | html2pdf.js                                     |
| Dev tooling | ESLint, Prettier, Husky, lint-staged            |

---

## Project Structure

```
DipleBill-seller/
├── src/
│   ├── App.tsx                  # Root (HashRouter)
│   ├── router/                  # Route definitions (index.tsx + routeList.ts)
│   ├── store/                   # Redux store, typed hooks
│   ├── components/              # Shared UI (shadcn/ui, custom) + hooks
│   ├── helpers/                 # axiosInstance, authSession, stringSimilarity
│   ├── lib/                     # cn() utility
│   └── modules/
│       ├── auth/                # Login, PrivateRoute gates, PIN lock, userSlice
│       ├── billing/             # POS, invoices, credit payments, cash control
│       ├── clients/             # Headless: services/slices/types only (no UI page)
│       ├── layout/              # TopBar + BottomNav, 404
│       ├── stores/              # Store context (storeSlice)
│       └── types/               # Shared TS declarations (index.d.ts)
├── package.json
├── vite.config.ts
├── tailwind.config.js
├── tsconfig.json
├── vercel.json                  # SPA rewrite
├── LOGIC.md                     # Spanish architecture/flow docs (auth + POS)
└── CLEANUP-PLAN.md              # Dead-code removal plan (executed 2026-07-05)
```

---

## App Surface (all of it)

- `/login` — owner/admin login (`POST /v1/login`)
- `/` and `/venta` — POS billing screen
- `/invoices`, `/invoices/:id` — invoice list and detail
- `/credits` — credit payments (search a specific credit, register an abono)
- `/caja` — cash control (shift totals, cash in/out, close session)
- Everything else falls through to the 404 page

---

## Architecture Patterns

### State Management

- **Redux Toolkit** with exactly five slices: `userSlice`, `clientSlice`, `storeSlice`, `billingSlice`, `cashSlice`
- `combineReducers` → root reducer with global reset on `userLogout` or `resetAppState`
- Typed hooks: `useAppDispatch`, `useAppSelector`

### API Layer

- Central `axiosInstance` in `src/helpers/axiosInstance.ts`
- `baseURL` from `VITE_API_BASE_URL` env var
- Request interceptor attaches `Authorization: Bearer <token>` from localStorage

### Auth Flow (gate sequence — do not reorder)

1. **Owner token** — `useValidateToken()` → `GET /v1/validateToken`; no token → redirect to `/login`
2. **Seller PIN session** — `PinLockOverlay` (seller code + PIN → `POST /v1/sellers/seller-login`); mode from admin setting `seller_login_mode`
3. **Cash session** — if `cash_control_mode` is `STRICT` and no session is open, `CashSessionOverlay` blocks all pages
4. Two logout levels in `TopBar`: seller logout (back to PIN lock) and full admin logout (`performLogout`, resets everything)

### Printing (browser-only)

```
Print button clicked
  ├─ Print → hidden iframe + window.print()
  └─ Download PDF → html2pdf.js → saves .pdf file
```

No `window.api`, no ESC/POS. Receipt fields must stay aligned between `InvoiceData`, the HTML template in `src/modules/billing/helpers/index.ts`, and the payment-method formatting in `print.ts`.

---

## Environment Variables

| Variable            | Description          |
| ------------------- | -------------------- |
| `VITE_API_BASE_URL` | Backend API base URL |

---

## Key Commands

| Command          | Description                                    |
| ---------------- | ---------------------------------------------- |
| `bun run dev`    | Vite dev server (HTTPS via vite-plugin-mkcert) |
| `bun run build`  | TypeScript check + Vite production build       |
| `bun run lint`   | ESLint check                                   |
| `bun run format` | Prettier                                       |

---

## Conventions

- **Language**: UI text is in Spanish
- **Formatting**: Prettier with single quotes, semicolons, no trailing commas, 2-space indent, 100 char width
- **Component style**: shadcn/ui patterns (Radix + CVA + Tailwind)
- **File naming**: PascalCase for components, camelCase for helpers/services, kebab-case for UI primitives
- **Aliases**: `@` => `src`, `@modules` => `src/modules`, plus `@router/*`, `@store/*`, `@types/*` (=> `src/modules/types/*`)

---

## Styling and Design Tokens

- **Tokens only.** Use the shadcn-style HSL variables defined in `src/index.css` (`--primary`, `--muted-foreground`, `--ring`, `--destructive`, ...) via the Tailwind aliases declared in `tailwind.config.js` (`bg-primary`, `text-muted-foreground`, `border-destructive`, ...). Do **not** use raw Tailwind palette classes (`bg-green-500`, `text-purple-600`, `border-amber-400`) or arbitrary color values (`bg-[#1a4ccb]`, `text-[hsl(...)]`) in new code.
- **Add the token first.** If a needed color does not have a token, add the variable to `:root` (and `.dark` if applicable) in `src/index.css` and the alias to `tailwind.config.js` before using it. Token names are semantic (`--sale-accent`, `--badge-success-soft`), not literal.
- **State-driven theming via `data-*` attributes.** When a color must vary by component state, set the override on a parent attribute (e.g. `[data-sell-type='credito'] { --sale-accent: ... }`) and let the cascade do the work. Components reference the token, not the state.
- **Documented exception.** PDF/receipt HTML strings in `src/modules/billing/helpers/index.ts` render in a detached document without access to `:root` variables and may use literal colors.
- **Migration is opportunistic.** Existing raw-color code is migrated phase by phase per `docs/superpowers/specs/2026-05-18-sale-type-clarity-design.md` (Appendix A). When you touch a file, prefer migrating its colors to tokens rather than leaving them mixed. Do not stop in the middle of a feature to do a sweeping color refactor.
