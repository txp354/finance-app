"use client";

import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";
import { ChartTooltip } from "./chart-tooltip";

export type CategorySlice = { category: string; amount: number };

// Fixed slot order (validated for colorblind separation); "Other" is always neutral gray.
const SLOT_COLORS = ["var(--chart-1)", "var(--chart-2)", "var(--chart-3)", "var(--chart-4)", "var(--chart-5)"];
const OTHER_COLOR = "var(--chart-other)";

export function CategoryPie({ data, period }: { data: CategorySlice[]; period: string }) {
  const total = data.reduce((sum, d) => sum + d.amount, 0);
  const slices = data.map((d, i) => ({
    ...d,
    fill: d.category === "Other" ? OTHER_COLOR : SLOT_COLORS[i % SLOT_COLORS.length],
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle>Spending by category</CardTitle>
        <CardDescription>{period}</CardDescription>
      </CardHeader>
      <CardContent>
        {total === 0 ? (
          <p className="text-muted-foreground flex h-64 items-center justify-center text-sm">
            No expenses recorded this month.
          </p>
        ) : (
          <div className="flex flex-col items-center gap-6 sm:flex-row lg:flex-col xl:flex-row">
            <figure className="relative size-48 shrink-0" aria-label="Donut chart of expenses by category">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={slices}
                    dataKey="amount"
                    nameKey="category"
                    innerRadius="62%"
                    outerRadius="100%"
                    startAngle={90}
                    endAngle={-270}
                    stroke="var(--card)"
                    strokeWidth={2}
                    isAnimationActive={false}
                  >
                    {slices.map((s) => (
                      <Cell key={s.category} fill={s.fill} />
                    ))}
                  </Pie>
                  <Tooltip content={ChartTooltip} />
                </PieChart>
              </ResponsiveContainer>
              <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-muted-foreground text-xs">Total</span>
                <span className="text-lg font-semibold tabular-nums">{formatCurrency(total)}</span>
              </div>
            </figure>

            {/* Legend doubles as the data table: every slice is labeled with its value. */}
            <table className="w-full text-sm">
              <caption className="sr-only">Expenses by category</caption>
              <tbody>
                {slices.map((s) => (
                  <tr key={s.category} className="border-b last:border-0">
                    <td className="py-1.5">
                      <span className="flex items-center gap-2">
                        <span className="size-2.5 shrink-0 rounded-sm" style={{ background: s.fill }} />
                        {s.category}
                      </span>
                    </td>
                    <td className="py-1.5 text-right font-medium tabular-nums">{formatCurrency(s.amount)}</td>
                    <td className="text-muted-foreground w-12 py-1.5 text-right tabular-nums">
                      {Math.round((s.amount / total) * 100)}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
