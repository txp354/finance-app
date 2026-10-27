import type { TooltipContentProps } from "recharts";
import type { NameType, ValueType } from "recharts/types/component/DefaultTooltipContent";
import { formatCurrency } from "@/lib/utils";

// Shared Recharts tooltip: series swatch + label in ink color, value right-aligned.
export function ChartTooltip({ active, payload, label }: TooltipContentProps<ValueType, NameType>) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-popover text-popover-foreground min-w-40 rounded-lg px-3 py-2 text-xs shadow-md ring-1 ring-foreground/10">
      {label != null && <div className="mb-1.5 font-medium">{label}</div>}
      <div className="flex flex-col gap-1">
        {payload.map((item) => (
          <div key={String(item.dataKey ?? item.name)} className="flex items-center gap-2">
            <span
              className="size-2.5 shrink-0 rounded-sm"
              style={{ background: (item.payload?.fill as string | undefined) ?? item.color }}
            />
            <span className="text-muted-foreground">{item.name}</span>
            <span className="ml-auto font-medium tabular-nums">{formatCurrency(Number(item.value))}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function LegendSwatch({ color, label }: { color: string; label: string }) {
  return (
    <span className="text-muted-foreground flex items-center gap-1.5 text-xs">
      <span className="size-2.5 rounded-sm" style={{ background: color }} />
      {label}
    </span>
  );
}
