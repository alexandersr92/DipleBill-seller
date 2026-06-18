# DipleBill — Project Overview

## Description

DipleBill is a **point-of-sale billing and inventory management** web/desktop application built with React + Vite, packaged as an Electron desktop app for thermal receipt printing. It manages invoicing, purchases, clients, suppliers, inventories, products, credits, and store settings for small to medium businesses.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, TypeScript, Vite (SWC) |
| Styling | Tailwind CSS, shadcn/ui, Radix UI, lucide-react |
| State | Redux Toolkit (slices + thunks) |
| Forms | react-hook-form, yup, zod |
| Routing | react-router-dom v6 |
| HTTP | Axios (intercepted with Bearer token) |
| PDF | html2pdf.js (wraps jsPDF + html2canvas) |
| Printing | ESC/POS via node-thermal-printer (Electron), silent HTML print fallback |
| Desktop | Electron, electron-builder |
| Dev tooling | ESLint, Prettier, Husky, lint-staged |

---

## Project Structure

```
DipleBill/
├── electron/                    # Electron main process
│   ├── main.cjs                 # BrowserWindow, IPC handlers
│   ├── preload.cjs              # contextBridge (window.api)
│   └── print/
│       ├── thermalPrinter.cjs   # ESC/POS printer service (EPSON)
│       ├── buildInvoiceReceipt.cjs  # InvoiceData → text receipt lines
│       └── receiptLayout.cjs    # Fixed-width text helpers
├── src/
│   ├── App.tsx                  # Root (HashRouter in Electron, BrowserRouter in web)
│   ├── router/                  # Route definitions + PrivateRoute
│   ├── store/                   # Redux store, typed hooks
│   ├── components/              # Shared UI (shadcn/ui, custom)
│   ├── helpers/                 # Axios instance, utilities
│   ├── types/                   # Global TS declarations (electron.d.ts)
│   ├── lib/                     # cn() utility
│   └── modules/
│       ├── auth/                # Login, register, token validation, userSlice
│       ├── billing/             # POS billing, invoice list/detail, print helpers
│       ├── clients/             # Customer management
│       ├── compras/             # Purchases (buy from suppliers)
│       ├── credits/             # Credit sales tracking
│       ├── inventory/           # Inventory locations + products
│       ├── layout/              # Sidebar, dashboard, 404
│       ├── Organization/        # Organization setup
│       ├── product/             # Product catalog CRUD
│       ├── reports/             # Report generation, listing, download, delete
│       ├── settings/            # Store settings
│       ├── stores/              # Store context (storeSlice)
│       ├── supplier/            # Supplier + contacts management
│       ├── category/            # Categories API
│       └── tag/                 # Tags API
├── package.json
├── vite.config.ts
├── tailwind.config.js
├── tsconfig.json
└── .env
```

---

## Architecture Patterns

### State Management
- **Redux Toolkit** with feature slices per module
- `combineReducers` → root reducer with global reset on `userLogout` or `resetAppState`
- Typed hooks: `useAppDispatch`, `useAppSelector`
- Async thunks in `*Thunks.ts` files per module

### API Layer
- Central `axiosInstance` in `src/helpers/axiosInstance.ts`
- `baseURL` from `VITE_API_BASE_URL` env var
- Request interceptor attaches `Authorization: Bearer <token>` from localStorage
- Feature modules expose `*Api.ts` files calling REST endpoints (`/v1/...`)

### Auth Flow
1. Login → `POST /v1/login` → `dispatch(setUser())` → stores token in localStorage
2. `PrivateRoute` uses `useValidateToken()` hook → `GET /v1/validateToken`
3. Logout → `performLogout()` thunk → API call → clear localStorage → `dispatch(userLogout())` → root reducer resets all slices

### Routing
- `HashRouter` in Electron (file:// protocol), `BrowserRouter` in web
- `PrivateRoute` wraps authenticated pages
- Login and Register are public routes

### Printing Architecture
```
Print button clicked
  │
  ├─ Electron available?
  │   ├─ YES → window.api.printInvoice(data) → ESC/POS thermal
  │   │         ├─ Success → done
  │   │         └─ Fail → window.api.printSilent(html) → silent HTML print to default printer
  │   │
  │   └─ NO (browser) → iframe + window.print()
  │
  └─ Download PDF → html2pdf.js → saves .pdf file
```

- **ESC/POS**: `node-thermal-printer` (EPSON type), 48 chars/line for 80mm paper
- **Silent print**: Hidden BrowserWindow in main process, `webContents.print({ silent: true })`
- **PDF**: `html2pdf.js` rendering same HTML template
- **Logo**: Included in HTML/PDF, skipped in ESC/POS (phase 1)

---

## Environment Variables

| Variable | Description |
|----------|-------------|
| `VITE_API_BASE_URL` | Backend API base URL |
| `PRINTER_INTERFACE` | Thermal printer connection (`usb`, `tcp://ip:9100`, `printer:Name`) |
| `PRINTER_LINE_WIDTH` | Characters per line (default: 48 for 80mm) |

---

## Key Commands

| Command | Description |
|---------|-------------|
| `bun run dev` | Vite dev server (browser only) |
| `bun run dev:electron` | Vite + Electron dev mode |
| `bun run build` | TypeScript check + Vite production build |
| `bun run dist` | Package Electron app (output in `release/`) |
| `bun run lint` | ESLint check |

---

## Conventions

- **Language**: UI text is in Spanish
- **Formatting**: Prettier with single quotes, no semicolons trailing, 2-space indent, 100 char width
- **Component style**: shadcn/ui patterns (Radix + CVA + Tailwind)
- **File naming**: PascalCase for components, camelCase for helpers/services, kebab-case for UI primitives
- **Electron files**: CommonJS (`.cjs`) for Node.js compatibility in packaged app
- **Thermal printer**: Solux TP-88260 (EPSON-compatible, 80mm, USB)

---

## Styling and Design Tokens

- **Tokens only.** Use the shadcn-style HSL variables defined in `src/index.css` (`--primary`, `--muted-foreground`, `--ring`, `--destructive`, ...) via the Tailwind aliases declared in `tailwind.config.js` (`bg-primary`, `text-muted-foreground`, `border-destructive`, ...). Do **not** use raw Tailwind palette classes (`bg-green-500`, `text-purple-600`, `border-amber-400`) or arbitrary color values (`bg-[#1a4ccb]`, `text-[hsl(...)]`) in new code.
- **Add the token first.** If a needed color does not have a token, add the variable to `:root` (and `.dark` if applicable) in `src/index.css` and the alias to `tailwind.config.js` before using it. Token names are semantic (`--sale-accent`, `--badge-success-soft`), not literal.
- **State-driven theming via `data-*` attributes.** When a color must vary by component state, set the override on a parent attribute (e.g. `[data-sell-type='credito'] { --sale-accent: ... }`) and let the cascade do the work. Components reference the token, not the state.
- **Documented exceptions.** PDF/receipt HTML strings in `src/modules/billing/helpers/index.ts`, all `electron/**/*.cjs` code, and third-party SVG assets are exempt — they render outside the running app's CSS variables.
- **Migration is opportunistic.** Existing raw-color code is migrated phase by phase per `docs/superpowers/specs/2026-05-18-sale-type-clarity-design.md` (Appendix A). When you touch a file, prefer migrating its colors to tokens rather than leaving them mixed. Do not stop in the middle of a feature to do a sweeping color refactor.
