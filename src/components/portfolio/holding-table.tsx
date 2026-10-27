"use client";

import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { PlusIcon, RefreshCwIcon } from "lucide-react";
import { toast } from "sonner";
import { deleteHolding } from "@/actions/portfolio";
import { RowActions } from "@/components/shared/row-actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  cn,
  formatCurrency,
  formatPercent,
  formatShares,
  formatSignedCurrency,
} from "@/lib/utils";
import type { RefreshResponse, StockHolding } from "@/types";
import { HoldingModal } from "./holding-modal";

// Derived on the server (see portfolio/page.tsx).
export type HoldingRow = StockHolding & {
  marketValue: number | null;
  gain: number | null;
  gainPercent: number | null;
  lastFetchedLabel: string | null;
};

export type PortfolioTotals = {
  marketValue: number;
  gain: number | null;
  costBasis: number | null;
  gainPercent: number | null;
};

function GainCell({ gain, percent, currency }: { gain: number | null; percent: number | null; currency?: string }) {
  if (gain == null) return <span className="text-muted-foreground">—</span>;
  return (
    <span className={cn(gain > 0 && "text-positive", gain < 0 && "text-negative")}>
      {formatSignedCurrency(gain, currency)}
      {percent != null && <span className="block text-xs">{formatPercent(percent)}</span>}
    </span>
  );
}

export function HoldingTable({
  holdings,
  totals,
  stale,
}: {
  holdings: HoldingRow[];
  totals: PortfolioTotals;
  stale: boolean;
}) {
  const router = useRouter();
  const [refreshing, startRefresh] = useTransition();
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<StockHolding | null>(null);

  const refresh = useCallback(
    (silent: boolean) =>
      startRefresh(async () => {
        try {
          const res = await fetch("/api/stocks/refresh", { method: "POST" });
          if (!res.ok) throw new Error(`Request failed (${res.status})`);
          const body: RefreshResponse = await res.json();
          router.refresh();
          if (body.failed.length > 0) {
            toast.warning(`Couldn't update ${body.failed.map((f) => f.ticker).join(", ")}`, {
              description: body.failed[0].error,
            });
          } else if (!silent) {
            toast.success(`Updated ${body.updated} price${body.updated === 1 ? "" : "s"}`);
          }
        } catch (error) {
          toast.error("Price refresh failed", { description: (error as Error).message });
        }
      }),
    [router],
  );

  // Stale prices (see lib/portfolio.ts) refresh automatically once per visit.
  const autoRefreshed = useRef(false);
  useEffect(() => {
    if (stale && !autoRefreshed.current) {
      autoRefreshed.current = true;
      refresh(true);
    }
  }, [stale, refresh]);

  function openModal(holding: StockHolding | null) {
    setEditing(holding);
    setModalOpen(true);
  }

  return (
    <>
      <div className="mb-4 flex justify-end gap-2">
        <Button variant="outline" onClick={() => refresh(false)} disabled={refreshing || holdings.length === 0}>
          <RefreshCwIcon className={cn(refreshing && "animate-spin")} />
          {refreshing ? "Refreshing…" : "Refresh prices"}
        </Button>
        <Button onClick={() => openModal(null)}>
          <PlusIcon />
          Add holding
        </Button>
      </div>

      <Card className="py-0">
        <CardContent className="px-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="pl-4">Ticker</TableHead>
                <TableHead className="text-right">Shares</TableHead>
                <TableHead className="hidden text-right sm:table-cell">Avg cost</TableHead>
                <TableHead className="text-right">Last close</TableHead>
                <TableHead className="text-right">Value</TableHead>
                <TableHead className="hidden text-right md:table-cell">Gain / loss</TableHead>
                <TableHead className="w-12 pr-4" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {holdings.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-muted-foreground h-24 text-center">
                    No holdings yet. Add a ticker to start tracking.
                  </TableCell>
                </TableRow>
              ) : (
                holdings.map((h) => (
                  <TableRow key={h.id}>
                    <TableCell className="pl-4">
                      <div className="font-semibold">{h.ticker}</div>
                      <div className="text-muted-foreground text-xs">
                        {h.lastFetchedLabel ? `Updated ${h.lastFetchedLabel}` : "No price yet"}
                      </div>
                    </TableCell>
                    <TableCell className="text-right tabular-nums">{formatShares(h.shares)}</TableCell>
                    <TableCell className="hidden text-right tabular-nums sm:table-cell">
                      {h.costBasis != null ? formatCurrency(h.costBasis, h.currency) : "—"}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {h.lastClosePrice != null ? formatCurrency(h.lastClosePrice, h.currency) : "—"}
                    </TableCell>
                    <TableCell className="text-right font-medium tabular-nums">
                      {h.marketValue != null ? formatCurrency(h.marketValue, h.currency) : "—"}
                    </TableCell>
                    <TableCell className="hidden text-right tabular-nums md:table-cell">
                      <GainCell gain={h.gain} percent={h.gainPercent} currency={h.currency} />
                    </TableCell>
                    <TableCell className="pr-4 text-right">
                      <RowActions
                        label={h.ticker}
                        onEdit={() => openModal(h)}
                        onDelete={() => deleteHolding(h.id)}
                      />
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
            {holdings.length > 0 && (
              <TableFooter>
                <TableRow>
                  <TableCell className="pl-4">Total</TableCell>
                  <TableCell />
                  <TableCell className="hidden sm:table-cell" />
                  <TableCell />
                  <TableCell className="text-right tabular-nums">{formatCurrency(totals.marketValue)}</TableCell>
                  <TableCell className="hidden text-right tabular-nums md:table-cell">
                    <GainCell gain={totals.gain} percent={totals.gainPercent} />
                  </TableCell>
                  <TableCell className="pr-4" />
                </TableRow>
              </TableFooter>
            )}
          </Table>
        </CardContent>
      </Card>

      <HoldingModal open={modalOpen} onOpenChange={setModalOpen} holding={editing} />
    </>
  );
}
