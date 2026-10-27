import Link from "next/link";
import { differenceInCalendarDays, endOfMonth, format, startOfMonth, subMonths } from "date-fns";
import { CashFlowChart, type CashFlowPoint } from "@/components/dashboard/cash-flow-chart";
import { CategoryPie, type CategorySlice } from "@/components/dashboard/category-pie";
import { MetricCards } from "@/components/dashboard/metric-cards";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardAction, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { db } from "@/lib/db";
import { summarizePortfolio } from "@/lib/portfolio";
import {
  cn,
  formatCurrency,
  formatDate,
  formatSignedCurrency,
  toMonthlyAmount,
  upcomingRenewal,
} from "@/lib/utils";

export const dynamic = "force-dynamic";

const CHART_MONTHS = 6;
// Five colored slices plus a gray "Other" keeps the donut readable.
const MAX_SLICES = 5;

export default async function DashboardPage() {
  const now = new Date();
  const thisMonth = startOfMonth(now);
  const lastMonth = subMonths(thisMonth, 1);
  const chartStart = subMonths(thisMonth, CHART_MONTHS - 1);

  const [transactions, subscriptions, holdings, recent] = await Promise.all([
    db.transaction.findMany({ where: { date: { gte: chartStart, lte: endOfMonth(now) } } }),
    db.subscription.findMany({ where: { isActive: true } }),
    db.stockHolding.findMany(),
    db.transaction.findMany({ orderBy: [{ date: "desc" }, { createdAt: "desc" }], take: 5 }),
  ]);

  // Monthly income vs expenses buckets.
  const buckets = new Map<string, CashFlowPoint>();
  for (let i = 0; i < CHART_MONTHS; i++) {
    const month = subMonths(thisMonth, CHART_MONTHS - 1 - i);
    buckets.set(format(month, "yyyy-MM"), { month: format(month, "MMM"), income: 0, expenses: 0 });
  }
  const expensesByCategory = new Map<string, number>();
  for (const t of transactions) {
    const bucket = buckets.get(format(t.date, "yyyy-MM"));
    if (!bucket) continue;
    if (t.type === "INCOME") bucket.income += t.amount;
    else bucket.expenses += t.amount;
    if (t.type === "EXPENSE" && t.date >= thisMonth) {
      expensesByCategory.set(t.category, (expensesByCategory.get(t.category) ?? 0) + t.amount);
    }
  }
  const cashFlow = [...buckets.values()].map((b) => ({
    ...b,
    income: Math.round(b.income * 100) / 100,
    expenses: Math.round(b.expenses * 100) / 100,
  }));
  const current = buckets.get(format(thisMonth, "yyyy-MM"))!;
  const previous = buckets.get(format(lastMonth, "yyyy-MM"))!;

  const sorted = [...expensesByCategory.entries()].sort((a, b) => b[1] - a[1]);
  const categories: CategorySlice[] = sorted.slice(0, MAX_SLICES).map(([category, amount]) => ({ category, amount }));
  const otherTotal = sorted.slice(MAX_SLICES).reduce((sum, [, amount]) => sum + amount, 0);
  if (otherTotal > 0) {
    const existing = categories.find((c) => c.category === "Other");
    if (existing) existing.amount += otherTotal;
    else categories.push({ category: "Other", amount: otherTotal });
  }
  // "Other" always sits last so the colored slots stay in order.
  categories.sort((a, b) => Number(a.category === "Other") - Number(b.category === "Other"));

  const portfolio = summarizePortfolio(holdings, now);
  const renewals = subscriptions
    .map((s) => ({ ...s, upcoming: upcomingRenewal(s.nextRenewalDate, s.billingCycle, now) }))
    .sort((a, b) => a.upcoming.getTime() - b.upcoming.getTime())
    .slice(0, 4);

  return (
    <>
      <PageHeader title="Dashboard" description={`Overview for ${format(now, "MMMM yyyy")}`} />

      <div className="flex flex-col gap-6">
        <MetricCards
          metrics={{
            income: current.income,
            expenses: current.expenses,
            previousIncome: previous.income,
            previousExpenses: previous.expenses,
            portfolioValue: portfolio.totals.marketValue,
            portfolioGain: portfolio.totals.gain,
            portfolioGainPercent: portfolio.totals.gainPercent,
            monthlySubscriptions: subscriptions.reduce((sum, s) => sum + toMonthlyAmount(s.amount, s.billingCycle), 0),
          }}
        />

        <div className="grid gap-6 lg:grid-cols-5">
          <div className="lg:col-span-3">
            <CashFlowChart data={cashFlow} />
          </div>
          <div className="lg:col-span-2">
            <CategoryPie data={categories} period={`Expenses in ${format(now, "MMMM")}`} />
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Recent transactions</CardTitle>
              <CardAction>
                <Button variant="link" size="sm" asChild>
                  <Link href="/transactions">View all</Link>
                </Button>
              </CardAction>
            </CardHeader>
            <CardContent>
              {recent.length === 0 ? (
                <p className="text-muted-foreground text-sm">No transactions yet.</p>
              ) : (
                <ul className="divide-y">
                  {recent.map((t) => (
                    <li key={t.id} className="flex items-center justify-between gap-4 py-2 text-sm">
                      <div className="min-w-0">
                        <div className="truncate font-medium">{t.description || t.category}</div>
                        <div className="text-muted-foreground text-xs">
                          {t.category} · {formatDate(t.date)}
                        </div>
                      </div>
                      <span className={cn("font-medium tabular-nums", t.type === "INCOME" && "text-positive")}>
                        {formatSignedCurrency(t.type === "INCOME" ? t.amount : -t.amount)}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Upcoming renewals</CardTitle>
              <CardAction>
                <Button variant="link" size="sm" asChild>
                  <Link href="/subscriptions">Manage</Link>
                </Button>
              </CardAction>
            </CardHeader>
            <CardContent>
              {renewals.length === 0 ? (
                <p className="text-muted-foreground text-sm">No active subscriptions.</p>
              ) : (
                <ul className="divide-y">
                  {renewals.map((s) => {
                    const days = differenceInCalendarDays(s.upcoming, now);
                    return (
                      <li key={s.id} className="flex items-center justify-between gap-4 py-2 text-sm">
                        <div className="min-w-0">
                          <div className="truncate font-medium">{s.name}</div>
                          <div className="text-muted-foreground text-xs">
                            {formatDate(s.upcoming)} · {days === 0 ? "today" : days === 1 ? "tomorrow" : `in ${days} days`}
                          </div>
                        </div>
                        <span className="font-medium tabular-nums">{formatCurrency(s.amount)}</span>
                      </li>
                    );
                  })}
                </ul>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}
