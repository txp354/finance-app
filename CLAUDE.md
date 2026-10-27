# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

Local-first personal finance and stock portfolio tracker (transactions, subscriptions, stock holdings with closing-price sync). `SPEC.md` is the source of truth for the target directory layout, schema, and the four build phases; read it before starting a phase. All four phases are implemented: dashboard (`/`), `/transactions`, `/subscriptions`, `/portfolio`.

## Commands

```bash
npm run dev          # Next dev server (Turbopack) on http://localhost:3000
npm run build        # Production build (Turbopack)
npm run lint         # ESLint (flat config, next/core-web-vitals + typescript)
npm run db:migrate   # prisma migrate dev (create/apply migrations, regenerate client)
npm run db:seed      # tsx prisma/seed.ts — DELETES all rows in every table, then reseeds
npm run db:studio    # Prisma Studio
npx shadcn@latest add <component>   # Add shadcn/ui components into src/components/ui
```

There is no test runner. Verify with `npx tsc --noEmit`, `npm run lint`, and `npm run build`. Stop the dev server before `npm run build`: both write `.next/`, and a running dev server breaks (500s) after a build until `.next` is deleted and dev restarted.

Setup: copy `.env.example` to `.env`. `DATABASE_URL="file:./dev.db"` resolves relative to `prisma/schema.prisma`, so the SQLite file is `prisma/dev.db`.

## Architecture

- **Next.js 15 App Router + React 19, TypeScript.** Path alias `@/*` → `src/*`. Pages that read the DB are server components and use `export const dynamic = "force-dynamic"`.
- **Data access:** always import the Prisma singleton `db` from `src/lib/db.ts`. Don't create new `PrismaClient` instances in app code (the seed script is the one exception). Pages are server components that query `db` directly and pass plain data to client components.
- **Mutations:** server actions in `src/actions/` take `unknown` input, re-validate with the Zod schemas in `src/lib/schemas.ts`, return `ActionResult` (`{ success } | { success: false, error }`) instead of throwing, and call `revalidatePath` for their page and `/`. The same schemas drive the client forms through `zodResolver`. `"use server"` files may only export async functions, which is why schemas and constants live in `lib/schemas.ts`.
- **Forms:** each `*-modal.tsx` wraps an inner form component rendered inside `DialogContent`, so the form remounts and resets every time the dialog opens. Number inputs use `setValueAs: toOptionalNumber` (`components/shared/form-utils.ts`). Dates travel as `yyyy-MM-dd` strings and are parsed server-side with `parseISO` (local midnight).
- **Derived values:** computed server-side and passed down. This covers subscription monthly cost and rolled-forward renewal dates (`toMonthlyAmount` / `upcomingRenewal` in `lib/utils.ts`) and portfolio value and gain (`summarizePortfolio` in `lib/portfolio.ts`, shared by `/portfolio` and the dashboard). Relative dates ("in 3 days") come from the server so the server and client render the same markup (no hydration mismatch).
- **Types:** `src/types/index.ts` re-exports the Prisma model and enum types (`Transaction`, `Subscription`, `StockHolding`, `TransactionType`, `BillingCycle`) and defines `PriceFetchResult`. Import model types from there, not from `@prisma/client` directly.
- **Market data:** `src/lib/stock-service.ts` wraps `yahoo-finance2`. It prefers `regularMarketPreviousClose` and falls back to `regularMarketPrice`. An unknown symbol resolves to `undefined` (no throw) and is reported as `notFound`. Create and rename reject unknown tickers but still save on other failures, such as being offline. `POST /api/stocks/refresh` updates every holding. The holdings table calls it from the "Refresh prices" button, and automatically once per visit when any price is older than 12 hours (`lib/portfolio.ts`). Tickers are stored upper-case and are unique.
- **Schema notes:** SQLite with Prisma enums; money and share counts are `Float`; IDs are UUID strings. Subscriptions use `billingCycle` (MONTHLY/ANNUAL/WEEKLY), so normalize WEEKLY and ANNUAL amounts when computing monthly totals.
- **UI:** Tailwind v4 (`src/app/globals.css`, no tailwind.config) and shadcn/ui (style `radix-nova`, on the unified `radix-ui` package; components import `cn` from the `cn` package). Also Lucide icons, `sonner` toasts, `next-themes` (class strategy, toggle in the sidebar), and React Hook Form. Shared pieces live in `components/shared/` (`PageHeader`, `StatCard`, `RowActions` edit/delete menu with confirmation).
- **Charts (Recharts):** colors come from CSS tokens in `globals.css`: `--chart-1..5` (a colorblind-validated categorical order, light and dark), `--chart-other` (gray), `--chart-grid`, plus `--positive` / `--negative` for gain/loss text. Keep the slot order, and fold extra categories into "Other" rather than adding hues. Each chart includes a text/table alternative (an `sr-only` table, or the donut's legend table).

## Gotchas

- **Dark mode:** the app's theme is controlled only by the sun/moon toggle in `components/layout/sidebar.tsx`, via next-themes, which adds `.dark` to `<html>`. The Theme and Size options in the Next.js dev-tools "Preferences" panel style only the dev overlay, not the app. If the user reports dark mode "not working" from there, point them to the sidebar toggle. The dev overlay can be hidden with `devIndicators: false` in `next.config.ts`.
- **Hydration warnings:** `<html>` carries `suppressHydrationWarning` because next-themes and browser extensions (the user runs SwiftRead, which adds `data-swiftread-*` attributes) change it before React hydrates. Don't remove it. Avoid client-side `new Date()`-relative rendering; compute relative dates on the server (see Derived values above).
- **Lockfile warning:** `next dev` warns that it inferred the workspace root from a stray `C:\Users\Shaun\package-lock.json`. It's harmless, and silenced by setting `turbopack.root` in `next.config.ts` or deleting that file.

## Version pins (don't upgrade casually)

- **Prisma stays on v6.** v7 rejects `url = env(...)` in the datasource block.
- **`@hookform/resolvers` stays on v5.** v6 has a peer-dependency conflict.
- **yahoo-finance2 v3+** must be used through an instance (`new YahooFinance()`). The default export is no longer a ready-made client.
