# Technical Specification: Personal Finance & Stock Portfolio Tracker

**Document Version:** 1.0
**Target Environment:** Claude Code (CLI Agent)
**Primary Goal:** Build a fully functional, local-first web application for tracking personal income, expenses, subscriptions, and a stock portfolio with automated market closing price updates.

---

## 1. System Architecture & Tech Stack

- **Framework:** Next.js (App Router, React 19 / Next 15, TypeScript)
- **Styling:** Tailwind CSS + shadcn/ui (Radix primitives) + Lucide Icons
- **State & Forms:** React Hook Form + Zod validation
- **Database & ORM:** SQLite with Prisma ORM (stored at `prisma/dev.db`)
- **Visualizations:** Recharts
- **Market Data:** `yahoo-finance2` (Node.js API client, zero API-key requirement for daily closing quotes)

---

## 2. Directory Structure

```text
├── prisma/
│   ├── schema.prisma          # Database schema definition
│   └── seed.ts                # Seed script with initial dummy data
├── src/
│   ├── app/
│   │   ├── layout.tsx         # Root layout with sidebar navigation
│   │   ├── page.tsx           # Dashboard view (analytics & summary cards)
│   │   ├── transactions/
│   │   │   └── page.tsx       # Income & Expense management
│   │   ├── subscriptions/
│   │   │   └── page.tsx       # Recurring obligations management
│   │   ├── portfolio/
│   │   │   └── page.tsx       # Stock holdings & price sync
│   │   └── api/
│   │       └── stocks/
│   │           └── refresh/
│   │               └── route.ts  # Endpoint to trigger closing price updates
│   ├── actions/
│   │   ├── transactions.ts    # Server actions for CRUD on transactions
│   │   ├── subscriptions.ts   # Server actions for CRUD on subscriptions
│   │   └── portfolio.ts       # Server actions for stock holdings
│   ├── components/
│   │   ├── layout/
│   │   │   └── sidebar.tsx    # Desktop & mobile nav
│   │   ├── dashboard/
│   │   │   ├── metric-cards.tsx
│   │   │   ├── cash-flow-chart.tsx
│   │   │   └── category-pie.tsx
│   │   ├── transactions/
│   │   │   ├── transaction-modal.tsx
│   │   │   └── transaction-table.tsx
│   │   ├── subscriptions/
│   │   │   └── subscription-list.tsx
│   │   ├── portfolio/
│   │   │   ├── holding-modal.tsx
│   │   │   └── holding-table.tsx
│   │   └── ui/                # Generated shadcn components
│   ├── lib/
│   │   ├── db.ts              # Prisma client singleton
│   │   ├── stock-service.ts   # yahoo-finance2 integration logic
│   │   └── utils.ts           # Formatters (currency, dates)
│   └── types/
│       └── index.ts           # Shared TypeScript interfaces
├── .env.example
├── package.json
└── tsconfig.json
```

---

## 3. Database Schema (`prisma/schema.prisma`)

```prisma
datasource db {
  provider = "sqlite"
  url      = env("DATABASE_URL")
}

generator client {
  provider = "prisma-client-js"
}

enum TransactionType {
  INCOME
  EXPENSE
}

enum BillingCycle {
  MONTHLY
  ANNUAL
  WEEKLY
}

model Transaction {
  id          String          @id @default(uuid())
  type        TransactionType
  amount      Float
  category    String          // Rent, Food, Groceries, Utilities, Subscriptions, Salary, etc.
  description String?
  date        DateTime        @default(now())
  createdAt   DateTime        @default(now())
  updatedAt   DateTime        @updatedAt
}

model Subscription {
  id              String       @id @default(uuid())
  name            String       // e.g., Netflix, Gym, Rent, Internet
  amount          Float
  billingCycle    BillingCycle @default(MONTHLY)
  category        String       @default("Subscriptions")
  nextRenewalDate DateTime
  isActive        Boolean      @default(true)
  createdAt       DateTime     @default(now())
  updatedAt       DateTime     @updatedAt
}

model StockHolding {
  id             String    @id @default(uuid())
  ticker         String    @unique // Upper-cased (e.g., AAPL, NVDA, VOO)
  shares         Float     // Supports fractional shares (e.g., 2.5)
  costBasis      Float?    // Average purchase price per share (optional)
  lastClosePrice Float?    // Most recent closing price fetched
  currency       String    @default("USD")
  lastFetchedAt  DateTime? // Timestamp of the last successful price update
  createdAt      DateTime  @default(now())
  updatedAt      DateTime  @updatedAt
}
```

---

## 4. Market Data Service & Dependencies

`src/lib/stock-service.ts`:

```ts
import YahooFinance from "yahoo-finance2";

const yahooFinance = new YahooFinance();

export async function fetchStockClosePrice(ticker: string) {
  try {
    const quote = await yahooFinance.quote(ticker.toUpperCase());
    return {
      price: quote.regularMarketPreviousClose ?? quote.regularMarketPrice ?? 0,
      currency: quote.currency || "USD",
      success: true,
    };
  } catch (error) {
    return { price: null, error: (error as Error).message, success: false };
  }
}
```

> yahoo-finance2 v3+ requires `new YahooFinance()`; the default export is no longer a ready-made instance.

Dependencies:

```bash
npm install @prisma/client@6 lucide-react recharts yahoo-finance2 zod react-hook-form @hookform/resolvers@5 date-fns
npm install -D prisma@6 tsx
```

> Prisma is pinned to v6 because v7 no longer accepts `url = env(...)` in the schema. `@hookform/resolvers` is pinned to v5 because v6 has a peer-dependency conflict.

---

## 5. Build Phases

### Phase 1: Foundation
- Initialize the Next.js app with Tailwind and shadcn/ui
- Configure Prisma with the schema above, run migrations, and seed initial data
- Verify: migrations applied, seed row counts > 0, `npm run build` and `npm run lint` pass

### Phase 2: Transactions & Subscriptions
- Server actions for CRUD (`src/actions/transactions.ts`, `src/actions/subscriptions.ts`) with Zod validation
- Sidebar layout; Transactions page (table + modal form); Subscriptions page (list, monthly cost total)

### Phase 3: Portfolio & Price Sync
- Holdings CRUD (`src/actions/portfolio.ts`), holding table and modal
- `POST /api/stocks/refresh` updates `lastClosePrice` / `lastFetchedAt` through `stock-service.ts`
- Market value, gain/loss per holding and in total

### Phase 4: Dashboard
- Metric cards (income, expenses, net cash flow, portfolio value)
- Cash-flow chart (monthly income vs expenses) and expense category pie chart (Recharts)
