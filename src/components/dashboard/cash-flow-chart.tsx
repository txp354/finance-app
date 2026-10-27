"use client";

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";
import { ChartTooltip, LegendSwatch } from "./chart-tooltip";

export type CashFlowPoint = { month: string; income: number; expenses: number };

const SERIES = [
  { key: "income", label: "Income", color: "var(--chart-1)" },
  { key: "expenses", label: "Expenses", color: "var(--chart-2)" },
] as const;

const compactCurrency = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  notation: "compact",
  maximumFractionDigits: 1,
});

export function CashFlowChart({ data }: { data: CashFlowPoint[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Cash flow</CardTitle>
        <CardDescription>Income vs expenses, last {data.length} months</CardDescription>
        <CardAction className="flex gap-3">
          {SERIES.map((s) => (
            <LegendSwatch key={s.key} color={s.color} label={s.label} />
          ))}
        </CardAction>
      </CardHeader>
      <CardContent>
        <figure className="h-64" aria-label="Bar chart of monthly income and expenses">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} barGap={2} barCategoryGap="28%" margin={{ top: 8, right: 0, left: 0, bottom: 0 }}>
              <CartesianGrid vertical={false} stroke="var(--chart-grid)" />
              <XAxis
                dataKey="month"
                tickLine={false}
                axisLine={{ stroke: "var(--border)" }}
                tick={{ fill: "var(--muted-foreground)", fontSize: 12 }}
              />
              <YAxis
                width={56}
                tickLine={false}
                axisLine={false}
                tick={{ fill: "var(--muted-foreground)", fontSize: 12 }}
                tickFormatter={(v: number) => compactCurrency.format(v)}
              />
              <Tooltip content={ChartTooltip} cursor={{ fill: "var(--muted)", opacity: 0.6 }} />
              {SERIES.map((s) => (
                <Bar
                  key={s.key}
                  dataKey={s.key}
                  name={s.label}
                  fill={s.color}
                  radius={[4, 4, 0, 0]}
                  maxBarSize={28}
                />
              ))}
            </BarChart>
          </ResponsiveContainer>
        </figure>
        {/* Text alternative for screen readers. */}
        <table className="sr-only">
          <caption>Monthly income and expenses</caption>
          <thead>
            <tr>
              <th>Month</th>
              <th>Income</th>
              <th>Expenses</th>
            </tr>
          </thead>
          <tbody>
            {data.map((d) => (
              <tr key={d.month}>
                <td>{d.month}</td>
                <td>{formatCurrency(d.income)}</td>
                <td>{formatCurrency(d.expenses)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </CardContent>
    </Card>
  );
}
