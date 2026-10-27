import { ArrowDownRightIcon, ArrowUpRightIcon, LandmarkIcon, ScaleIcon, TrendingUpIcon, WalletIcon } from "lucide-react";
import { StatCard } from "@/components/shared/stat-card";
import { cn, formatCurrency, formatPercent, formatSignedCurrency } from "@/lib/utils";

export type DashboardMetrics = {
  income: number;
  expenses: number;
  previousIncome: number;
  previousExpenses: number;
  portfolioValue: number;
  portfolioGain: number | null;
  portfolioGainPercent: number | null;
  monthlySubscriptions: number;
};

// "vs last month" hint; for expenses, going down is the good direction.
function Delta({ current, previous, lowerIsBetter }: { current: number; previous: number; lowerIsBetter?: boolean }) {
  if (previous === 0) return <>No data last month</>;
  const change = (current - previous) / previous;
  const good = lowerIsBetter ? change < 0 : change > 0;
  const Icon = change >= 0 ? ArrowUpRightIcon : ArrowDownRightIcon;
  return (
    <span className="flex items-center gap-1">
      <span className={cn("flex items-center", change !== 0 && (good ? "text-positive" : "text-negative"))}>
        <Icon className="size-3.5" />
        {formatPercent(change)}
      </span>
      vs last month
    </span>
  );
}

export function MetricCards({ metrics }: { metrics: DashboardMetrics }) {
  const net = metrics.income - metrics.expenses;
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <StatCard
        label="Income this month"
        icon={<WalletIcon />}
        value={formatCurrency(metrics.income)}
        hint={<Delta current={metrics.income} previous={metrics.previousIncome} />}
      />
      <StatCard
        label="Expenses this month"
        icon={<LandmarkIcon />}
        value={formatCurrency(metrics.expenses)}
        hint={<Delta current={metrics.expenses} previous={metrics.previousExpenses} lowerIsBetter />}
      />
      <StatCard
        label="Net cash flow"
        icon={<ScaleIcon />}
        value={<span className={cn(net < 0 && "text-negative")}>{formatSignedCurrency(net)}</span>}
        hint={`Subscriptions: ${formatCurrency(metrics.monthlySubscriptions)}/mo`}
      />
      <StatCard
        label="Portfolio value"
        icon={<TrendingUpIcon />}
        value={formatCurrency(metrics.portfolioValue)}
        hint={
          metrics.portfolioGain != null ? (
            <span
              className={cn(
                metrics.portfolioGain > 0 && "text-positive",
                metrics.portfolioGain < 0 && "text-negative",
              )}
            >
              {formatSignedCurrency(metrics.portfolioGain)}
              {metrics.portfolioGainPercent != null && ` (${formatPercent(metrics.portfolioGainPercent)})`} all time
            </span>
          ) : (
            "Add cost basis to track gains"
          )
        }
      />
    </div>
  );
}
