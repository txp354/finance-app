import { formatDistanceToNow, subHours } from "date-fns";
import type { StockHolding } from "@/types";

// Prices fetched longer ago than this are refreshed automatically on the portfolio page.
const STALE_AFTER_HOURS = 12;

export function summarizePortfolio(holdings: StockHolding[], now = new Date()) {
  const staleBefore = subHours(now, STALE_AFTER_HOURS);
  let marketValue = 0;
  let gain = 0;
  let costOfPriced = 0;
  let hasGain = false;

  const rows = holdings.map((h) => {
    const value = h.lastClosePrice != null ? h.lastClosePrice * h.shares : null;
    const cost = h.costBasis != null ? h.costBasis * h.shares : null;
    const rowGain = value != null && cost != null ? value - cost : null;

    if (value != null) marketValue += value;
    if (rowGain != null && cost != null) {
      gain += rowGain;
      costOfPriced += cost;
      hasGain = true;
    }

    return {
      ...h,
      marketValue: value,
      gain: rowGain,
      gainPercent: rowGain != null && cost ? rowGain / cost : null,
      lastFetchedLabel: h.lastFetchedAt ? formatDistanceToNow(h.lastFetchedAt, { addSuffix: true }) : null,
    };
  });

  return {
    rows,
    totals: {
      marketValue,
      gain: hasGain ? gain : null,
      costBasis: hasGain ? costOfPriced : null,
      gainPercent: hasGain && costOfPriced ? gain / costOfPriced : null,
    },
    stale: holdings.some((h) => !h.lastFetchedAt || h.lastFetchedAt < staleBefore),
  };
}
