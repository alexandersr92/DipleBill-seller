# Sale Type Clarity in Billing — Design

**Date:** 2026-05-18
**Status:** Approved (UI signed off via `prototypes/sale-type-prototype.html`)
**Module touched:** `src/modules/billing`
**Type:** UX hardening, no schema/API changes

## Problem

In the New Invoice form (`src/modules/billing/containers/index.tsx`) the "Tipo de venta" field defaults to **Contado** and offers a `<Select>` dropdown with `Contado` / `Crédito`. Sellers regularly forget to switch to `Crédito` for credit sales. The current selector hides its state behind a single dropdown line, the default sticks silently, and there is no checkpoint at submit time. The result is invoices saved as `Contado` when they should have been `Crédito` — no credit record gets created and the customer's debt is untracked.

## Goal

Make the current sale-type state **impossible to miss in the form flow** and add a single explicit checkpoint at submit so the seller can catch a wrong value before it is persisted. Reuse the existing badge palette (`AppBadge`) so the new visuals feel native to the app rather than introducing a new color system.

Non-goals:

- No backend changes. `IInvoice.isCredit`, `init_payment`, and the `createBilling` thunk stay as-is.
- No change to the keyboard navigation refs (`sellTypeTriggerRef`, `expirationButtonRef`, `paymentMethodTriggerRef`).
- No change to the rule that `Crédito` is only available once a client is selected.
- No new defaults driven by client history or wholesaler flag — explicitly out of scope for this iteration.

## Solution Overview

Two complementary changes:

1. **Always-visible, color-coded sale-type state.** Replace the dropdown with a 2-button segmented toggle. Both options are visible at all times; the active one is filled with the badge color (green for `Contado`, purple for `Crédito`). A 3-pixel accent line at the top of the New Invoice card and the Summary card tracks the same color, so the state reads even from peripheral vision.
2. **Confirmation modal on `Realizar venta`.** Submitting opens a modal that restates the sale type prominently (with the matching color chip), the client name, and the total. When the seller is about to submit a `Contado` sale the modal includes the nudge: _"¿El cliente está pagando en este momento? Si pagará después, cambia a **Crédito**."_ On `Crédito`, the modal restates the expiration date instead.

Together they address the same failure mode at two different points: the toggle prevents most mistakes during form fill, and the modal catches the rest at the last moment.

## Visual Design

Reference implementation: `prototypes/sale-type-prototype.html`. All Tailwind classes below match what is rendered there.

### Color system: state-driven semantic tokens

The form will theme itself via CSS variables, not via conditional className logic in components. This extends the existing shadcn-style HSL-variable pattern already in `src/index.css` (`--primary`, `--card`, etc.) rather than introducing a parallel system.

**New tokens added to `src/index.css`** (default values = `Contado` palette, tracks the system primary so any future `--primary` change propagates):

```css
:root {
  --sale-accent: var(--primary); /* tracks system primary */
  --sale-accent-foreground: var(--primary-foreground);
  --sale-accent-strong: 217 91% 60%; /* blue-500 — accent line */
  --sale-accent-soft: 214 100% 97%; /* blue-50  — pill bg */
  --sale-accent-text: var(--primary);
  --sale-accent-border: var(--primary);
}
```

`--sale-accent`, `-foreground`, `-text`, and `-border` reference `var(--primary)` directly so the Contado palette stays in sync with the project's primary blue (`221.2 83.2% 53.3%` light, `217.2 91.2% 59.8%` dark) without duplicating the value. `--sale-accent-strong` and `-soft` are pinned to specific blue scale values (`blue-500`, `blue-50`) since `--primary` does not have matching `*-strong` / `*-soft` siblings yet.

**Override block** (mirrors `AppBadge` `processing`):

```css
[data-sell-type='credito'] {
  --sale-accent: 262 83% 58%; /* purple-600 */
  --sale-accent-strong: 271 91% 65%; /* purple-500 */
  --sale-accent-soft: 270 100% 98%; /* purple-50 */
  --sale-accent-text: 262 83% 58%;
  --sale-accent-border: 262 83% 58%;
}
```

**Tailwind alias** added in `tailwind.config.js` under `theme.extend.colors`:

```js
'sale-accent': {
  DEFAULT:    'hsl(var(--sale-accent))',
  foreground: 'hsl(var(--sale-accent-foreground))',
  strong:     'hsl(var(--sale-accent-strong))',
  soft:       'hsl(var(--sale-accent-soft))',
  text:       'hsl(var(--sale-accent-text))',
  border:     'hsl(var(--sale-accent-border))'
}
```

**Activation.** The `<form>` element (or a wrapper inside `Billing`) carries `data-sell-type={sellType}`. Switching state from `Contado` to `Crédito` flips one attribute; every descendant that references `var(--sale-*)` re-themes through the cascade. No `isCredito ? 'bg-purple-...' : 'bg-green-...'` ternaries anywhere in the component tree.

**Class usage** (semantic, state-blind):

| Element                                      | Tailwind class                                                                                                                                               |
| -------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Active toggle button                         | `bg-sale-accent text-sale-accent-foreground border-sale-accent`                                                                                              |
| Top accent line on cards (3 px)              | `bg-sale-accent-strong`                                                                                                                                      |
| Summary pill                                 | `bg-sale-accent-soft text-sale-accent-text border border-sale-accent-border`                                                                                 |
| `Realizar venta` submit button               | `bg-sale-accent text-sale-accent-foreground hover:bg-sale-accent/90`                                                                                         |
| `Fecha de vencimiento` border (when Crédito) | `border-sale-accent/60`                                                                                                                                      |
| Modal accent (border, chip, confirm button)  | `border-sale-accent/40`, pill = `bg-sale-accent-soft text-sale-accent-text border-sale-accent-border`, button = `bg-sale-accent text-sale-accent-foreground` |

**Out of scope here.** Migrating `src/components/ui/AppBadge.tsx` itself to consume tokens (e.g. `--badge-success-*`, `--badge-processing-*`) is a wider refactor that touches every status pill in the app and is left for a future spec. The values above intentionally match the current `AppBadge` `success`/`processing` colors so the form looks like a continuation of that palette and the future migration won't introduce a visual jump.

### Segmented toggle

Replaces the existing `<Select>` block (lines ~376–405 of `src/modules/billing/containers/index.tsx`):

- Two equally-sized buttons inside a bordered frame. Frame uses `border-sale-accent/40 bg-sale-accent/5` — automatically green or purple depending on the form's `data-sell-type` attribute.
- Active button uses `bg-sale-accent text-sale-accent-foreground border-sale-accent`. Inactive button stays transparent with `text-muted-foreground` (or `text-slate-300`-equivalent token).
- The first button keeps `ref={sellTypeTriggerRef}`, `tabIndex={1}`, `data-enter-behavior="native"`, and `id="sell_type"` so the existing keyboard flow (Enter advancing, focus rotation in `handleKeyDown`) is preserved.
- The `Crédito` button is disabled (and the frame greys out) when `!isClientSelected`, matching today's behavior.
- A one-time pulse animation fires on the toggle wrapper when switching to `Crédito`. Defined as a keyframes block in `src/index.css` using the token: `box-shadow: 0 0 0 0 hsl(var(--sale-accent) / 0.55)` → `0 0 0 12px hsl(var(--sale-accent) / 0)`. The pulse therefore matches whichever sale-type is being entered (in practice, only Crédito triggers it).

### Accent line on form cards

Both the "Nueva factura" card and the "Resumen" card receive a 3-px top stripe that follows the current sale type. Implemented with the Tailwind `before:` pseudo-element pattern, no conditional class:

```
before:absolute before:inset-x-0 before:top-0 before:h-[3px] before:bg-sale-accent-strong before:rounded-t-lg
```

The line is _always present_ — green by default, purple under `data-sell-type='credito'` — so the form never looks "uncolored". This is the always-on cue that competes with the seller forgetting to look at the toggle.

### Summary badge

Replaces the current `<Badge className="hover:bg-primary/100 capitalize">` in `src/modules/billing/components/ProductTable.tsx` (line 447). Renders as a token-based pill so it inherits the current sale-type color from the cascade:

```
inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold uppercase tracking-wide
bg-sale-accent-soft text-sale-accent-text border border-sale-accent-border
```

No `variant` prop needed and no conditional class — the surrounding `data-sell-type` attribute drives the color.

### `Fecha de vencimiento` field

When `Crédito` is active, the date picker uses `border-sale-accent/60` so the connection between sale type and expiration date is visible. When `Contado`, the field renders at `opacity-50` to communicate that it is not in use. The "active vs inactive" branch is the only conditional in this field — the actual color is still token-driven.

### "Realizar venta" button

Replaces the current `bg-secondary text-primary` styling at lines ~493–500 with `bg-sale-accent text-sale-accent-foreground hover:bg-sale-accent/90`. No conditional class — the token cascade colors the button automatically.

### Confirmation modal

New component at `src/modules/billing/components/ConfirmSaleModal.tsx`.

Built on the existing `AlertDialog` primitive used elsewhere in this container (lines ~31–38 already import it). The modal's root element repeats the `data-sell-type={sellType}` attribute so the same token cascade applies inside the dialog (modals render in a portal outside the form, so the attribute must be set locally).

Content:

- Eyebrow: `Confirmar venta` (uppercase, `text-muted-foreground`).
- Title: `Vas a registrar una venta de` styled with `text-sale-accent-text`.
- Pill: `bg-sale-accent-soft text-sale-accent-text border border-sale-accent-border`, text reads `CONTADO` or `CRÉDITO` (driven by the literal `sellType` value).
- Total: `C$ {grand_total}` formatted via the existing `currencyFormatter`.
- Client line: `Cliente: <client_name>`.
- Conditional helper text (this is text content, not styling — it must branch on `sellType`):
  - On `Contado`: "¿El cliente está pagando en este momento? Si pagará después, cambia a **Crédito**."
  - On `Crédito`: "Se generará un crédito a nombre del cliente con vencimiento {invoice_expiration formatted}."
- Buttons: `Revisar` (cancel, secondary) and `Confirmar venta` (`bg-sale-accent text-sale-accent-foreground hover:bg-sale-accent/90` — token-driven, no conditional).

The modal opens _after_ react-hook-form validation passes and _after_ the existing `invoiceCreated.products.length > 0` guard. It does not bypass any existing checks; it only delays the call to `createBilling`. See "Submit flow" below.

## Behavior

### Submit flow change

Today (`src/modules/billing/containers/index.tsx` lines ~207–260):

```
form submit → handleSubmit(onSubmit) → validation → product check → createBilling thunk → toast → clearForm
```

After this change:

```
form submit → handleSubmit(onSubmit) → validation → product check → open ConfirmSaleModal
ConfirmSaleModal.onConfirm → createBilling thunk → toast → clearForm → close modal
ConfirmSaleModal.onCancel → close modal, leave form intact
```

Implementation note: the simplest approach is to split the existing `onSubmit` into:

- `onValidate(values)` — current validation + product check, then stash `values` in component state and open the modal.
- `onConfirmedSubmit()` — runs the existing `createBilling` block with the stashed values.

The "Realizar venta" button stays `type="submit"` so react-hook-form continues to drive validation.

### Existing keyboard / focus flow (unchanged)

- `onValueChange` on the toggle still calls `setSellType(value)`, `setValue('isCredit', value === SELL_TYPES.CREDITO, { shouldValidate: true })`, and the same `focusElement` jumps:
  - On `Crédito` → focus `expirationButtonRef.current`.
  - On `Contado` → focus `paymentMethodTriggerRef.current`.
- `useEffect` that resets `sellType` to `Contado` when the client is cleared (line 108) stays as-is.

### Modal cancellation

`Revisar` closes the modal and returns the seller to the filled-in form. No state is wiped. The seller can change the toggle (now visibly different) and resubmit.

## Files Touched

| File                                                  | Nature of change                                                                                                                                                                                                                                                                          |
| ----------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `src/index.css`                                       | Add `--sale-accent*` HSL variables to `:root` (Contado defaults). Add `[data-sell-type='credito']` override block. Add `@keyframes` for the toggle pulse using `hsl(var(--sale-accent) / α)`.                                                                                             |
| `tailwind.config.js`                                  | Extend `theme.extend.colors` with the `sale-accent` alias group consuming the new variables.                                                                                                                                                                                              |
| `src/modules/billing/containers/index.tsx`            | Set `data-sell-type={sellType}` on the form root. Replace `<Select>` block (~lines 376–405) with `<SaleTypeToggle>`. Add accent line to the two cards. Restyle `Realizar venta` button using `bg-sale-accent`. Split submit flow into validate-then-confirm. Render `<ConfirmSaleModal>`. |
| `src/modules/billing/components/SaleTypeToggle.tsx`   | **New.** Segmented control component (props: `value`, `onChange`, `disabled`, `triggerRef`). Uses semantic `bg-sale-accent` classes only — no conditional color logic.                                                                                                                    |
| `src/modules/billing/components/ConfirmSaleModal.tsx` | **New.** Wraps `AlertDialog`. Sets `data-sell-type={sellType}` on its own portal root (modals render outside the form). Uses `bg-sale-accent*` classes throughout. Props: `open`, `sellType`, `clientName`, `total`, `expirationDate`, `onCancel`, `onConfirm`.                           |
| `src/modules/billing/components/ProductTable.tsx`     | Replace the current `<Badge>` at line 447 with a token-styled pill (`bg-sale-accent-soft text-sale-accent-text border-sale-accent-border`).                                                                                                                                               |

No changes to: `billingSchema.ts`, `billingThunks.ts`, `billingSlice.tsx`, types in `src/modules/billing/types/index.ts`, `AppBadge.tsx`, Electron/print code paths.

## Validation Plan

Manual checks against the running app (`bun run dev`):

1. Form opens with the primary-blue accent on both cards and the `Contado` toggle filled blue. The form root has `data-sell-type="contado"`.
2. Selecting a client enables the `Crédito` toggle button.
3. Clicking `Crédito`: form root attribute flips to `data-sell-type="credito"`. Toggle flips purple, accent line on both cards turns purple, expiration field outline turns purple, summary pill becomes purple, submit button turns purple, pulse animation fires once. **Verify in DevTools** that no element required a className change to re-color — only the data attribute on the form root changed.
4. Clicking `Contado` again: everything reverts to primary blue via the same single attribute flip.
5. Keyboard flow:
   - Enter on the client field still focuses the `Crédito` button via `sellTypeTriggerRef`.
   - Enter on the toggle still advances to `expirationButtonRef` (Crédito) or `paymentMethodTriggerRef` (Contado).
6. Submitting with no products → existing toast still fires, modal does **not** open.
7. Submitting with products → confirmation modal opens with correct color, total, client name, and conditional helper text. The modal carries its own `data-sell-type` attribute (since it portals out of the form).
8. `Revisar` closes the modal without clearing the form.
9. `Confirmar venta` runs `createBilling`, success toast appears, post-invoice dialog opens (existing behavior).
10. `clearForm()` after a successful submit resets the toggle to green `Contado` and the cards to green accent.
11. Visual parity check: the summary pill matches the `AppBadge processing` / `success` look used in the invoice list (`Pagada`, `Credito` pills).
12. Token verification: with the form on `Contado`, in DevTools inspect a token consumer (e.g. accent line element) and confirm the computed `background-color` resolves through `--sale-accent-strong`. Switch to `Crédito`, recompute, confirm new value.

Lint pass: `bun run lint` clean for touched files.

## Open Questions / Decisions Locked

- **Color choice locked:** Contado tracks the system `--primary` blue (with paired `blue-500` / `blue-50` for the strong/soft slots); Crédito uses `processing`-purple. The Contado palette intentionally references `var(--primary)` rather than hardcoding a blue value, so the New Invoice form will follow any future primary-color change automatically.
- **Token strategy locked:** state-driven semantic tokens (`--sale-accent*`) on a `data-sell-type` attribute. Components reference the tokens, not the underlying colors.
- **Default `Contado` retained.** The seller still lands on `Contado`. The combination of always-visible color cue + submit confirmation is judged sufficient given the user's framing ("seller forgets to switch"). Forcing an explicit choice would slow every cash sale — explicitly rejected during brainstorming.
- **No smart defaults this iteration** (e.g. wholesaler auto-default, last-sale-type memory). Can be layered on later if the visual hardening alone is not enough.
- **Confirm-on-Crédito copy:** restates the expiration date so the seller catches an incorrect default expiration. No "are you sure?" friction beyond the same single click.
- **Prototype is authoritative for visuals.** Implementation plan should treat `prototypes/sale-type-prototype.html` as the spec of truth for colors, spacing, and animations.

## Appendix A: Codebase Audit — Tokens vs Raw Colors

A scan of `src/` (executed 2026-05-18) found the following non-token color usage. Grouped by migration shape and ordered by ROI.

### A.1 — `theme_blue` (highest impact, lowest risk)

`tailwind.config.js` defines `theme_blue: '#1a4ccb'` and it is used **33 times across 12 files**, almost exclusively as `focus-visible:ring-theme_blue` for focus rings.

The token system already has `--ring`. Migration:

- Replace every `ring-theme_blue` with `ring-ring` (or `ring-primary` if the team prefers).
- If the existing `--ring` HSL doesn't match `#1a4ccb`, update it once in `src/index.css` rather than keeping the duplicate.
- Remove `theme_blue` from `tailwind.config.js`.

Affected files: `src/modules/billing/{components,containers}/{ProductTable,Columns,InvoiceListActions,CustomSearchInputSuggetions,index,invoice}.tsx`, `src/modules/compras/{components,containers}/{PurchaseTable,PurchaseSearchInput,index}.tsx`, `src/modules/credits/components/{RelatedInvoices,PaymentsHistory}.tsx`, `src/components/ui/SearchSelect.tsx`.

Estimate: ~30 minutes, mechanical find-replace + lint.

### A.2 — Arbitrary hex (`text-[#71717A]` etc.)

22 instances across 5 files. The dominant pattern is `text-[#71717A]` on `TableHead` and secondary text — that hex is exactly `--muted-foreground`.

| File                                                    | Occurrences | Likely token replacement                 |
| ------------------------------------------------------- | ----------- | ---------------------------------------- |
| `src/modules/billing/components/ProductTable.tsx`       | 8           | `text-muted-foreground`                  |
| `src/modules/compras/components/PurchaseTable.tsx`      | 7           | `text-muted-foreground` (audit per line) |
| `src/modules/billing/containers/invoice.tsx`            | 5           | audit per line                           |
| `src/modules/compras/containers/index.tsx`              | 1           | audit per line                           |
| `src/modules/supplier/components/edit-dialog/index.tsx` | 1           | audit per line                           |

Estimate: 1–2 hours, requires per-line decision but most are `text-muted-foreground` or `border-border`.

### A.3 — `AppBadge.tsx` variant tokens (medium effort, high reach)

`src/components/ui/AppBadge.tsx` is the source of truth for status pills app-wide. It currently hardcodes 9 Tailwind triplets (e.g. `bg-green-50 text-green-600 border-green-600`). Variants used by the app: `success`, `error`, `warning`, `info`, `neutral`, `processing`, `draft`, `paused`, `archived`.

Migration shape:

```css
:root {
  --badge-success-soft: 138 76% 97%;
  --badge-success-text: 142 76% 36%;
  --badge-success-border: 142 76% 36%;
  --badge-processing-soft: 270 100% 98%;
  --badge-processing-text: 262 83% 58%;
  --badge-processing-border: 262 83% 58%;
  /* ...one trio per variant... */
}
```

Then `AppBadge.tsx` becomes:

```ts
success: 'bg-badge-success-soft text-badge-success-text border-badge-success-border border';
```

Call sites (`<AppBadge variant="success" />`) don't change. Adds dark-mode theming for free. The `--sale-accent*` set introduced by this spec uses the same numeric values as `success`/`processing`, so no visual jump when this migration lands.

Estimate: 2–3 hours including dark mode pass.

### A.4 — `src/components/ui/toast.tsx`

Hardcoded Tailwind colors for the `success`, `error`, `warning` toast variants (4 occurrences). Should consume the same `--badge-*` tokens introduced in A.3 — toast and badge share semantic meaning.

### A.5 — `src/index.css` `.form-error`

```
@apply text-[0.8125rem] leading-none text-red-500 ...
```

Replace `text-red-500` with `text-destructive`.

### A.6 — Documented exception: PDF / receipt template

`src/modules/billing/helpers/index.ts` builds an HTML string passed to `html2pdf.js` and the silent-print fallback. That HTML renders in a detached document that does **not** have access to the running app's `:root` variables. 15 raw Tailwind color classes there are an intentional exception.

Recommended next step (out of scope for this spec): extract the receipt palette into a TypeScript constant (`receiptColors.ts`) whose hex values are kept in sync with the token HSL values via a comment, so future visual changes don't drift between in-app and printed receipts.

### A.7 — Phasing

| Phase | Scope                                                                       | Lands with                                      |
| ----- | --------------------------------------------------------------------------- | ----------------------------------------------- |
| 0     | `--sale-accent*` introduced + used in billing form                          | This spec                                       |
| 1     | `theme_blue` → `ring-ring` (A.1)                                            | Standalone PR, unblocks Tailwind config cleanup |
| 2     | Arbitrary hex audit (A.2)                                                   | Standalone PR per module                        |
| 3     | `AppBadge` + `toast` migrate to `--badge-*` (A.3, A.4) + `form-error` (A.5) | Standalone PR                                   |
| 4     | Receipt palette extraction (A.6)                                            | Optional, low priority                          |

These follow-up phases are signposts, not commitments. They should be tackled when the relevant files are next touched, not as a single big-bang refactor.

## Appendix B: Project Convention — Tokens Only

This spec triggers the codification of a styling rule for the project:

> **Always use design tokens from `src/index.css` (consumed via the Tailwind aliases in `tailwind.config.js`). Do not use raw Tailwind palette classes (`bg-green-500`, `text-purple-600`, ...) or arbitrary color values (`bg-[#1a4ccb]`, `text-[hsl(...)]`) in new code. If a needed color does not have a token, add the token first, then use it.**

Documented in:

- `AGENTS.md` — under a new "Styling and Design Tokens" section.
- `CLAUDE.md` — same section, kept in sync with AGENTS.md.
- `.cursor/rules/styling-tokens.mdc` — a globbed rule covering `src/**/*.{ts,tsx,css}` for IDE-level enforcement.

Documented exceptions:

- `src/modules/billing/helpers/index.ts` (PDF/receipt HTML — runs outside the app's CSS).
- `electron/**/*.cjs` (main process / Node runtime — no Tailwind).
- Third-party SVG assets where re-coloring is not viable.

The rule applies to **new** code unconditionally. Existing raw-color code is migrated opportunistically when touched (per the phases in Appendix A).
