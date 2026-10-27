import type { Metadata } from "next";
import { HoldingTable } from "@/components/portfolio/holding-table";
import { PageHeader } from "@/components/shared/page-header";
import { StatCard } from "@/components/shared/stat-card";
import { db } from "@/lib/db";
import { summarizePortfolio } from "@/lib/portfolio";
import { cn, formatCurrency, formatPercent, formatSignedCurrency } from "@/lib/utils";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Portfolio · Finance Tracker" };

export default async function PortfolioPage() {
  const holdings = await db.stockHolding.findMany({ orderBy: { ticker: "asc" } });
  const { rows, totals, stale } = summarizePortfolio(holdings);
  const mixedCurrency = new Set(holdings.map((h) => h.currency)).size > 1;

  return (
    <>
      <PageHeader title="Portfolio" description="Stock holdings valued at the latest market close." />
      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <StatCard
          label="Market value"
          value={formatCurrency(totals.marketValue)}
          hint={mixedCurrency ? "Mixed currencies summed without conversion" : `${holdings.length} holdings`}
        />
        <StatCard
          label="Total gain / loss"
          value={totals.gain != null ? formatSignedCurrency(totals.gain) : "—"}
          hint={totals.gainPercent != null ? formatPercent(totals.gainPercent) : "Add cost basis to track"}
          hintClassName={cn(
            totals.gain != null && totals.gain > 0 && "text-positive",
            totals.gain != null && totals.gain < 0 && "text-negative",
          )}
        />
        <StatCard
          label="Cost basis"
          value={totals.costBasis != null ? formatCurrency(totals.costBasis) : "—"}
          hint="Holdings with a price and cost"
        />
      </div>
      <HoldingTable holdings={rows} totals={totals} stale={stale} />
    </>
  );
}
