import { addMonths, addWeeks, addYears, format, startOfDay } from "date-fns";
import type { BillingCycle } from "@/types";

export { cn } from "cn";

const currencyFormatters = new Map<string, Intl.NumberFormat>();

export function formatCurrency(amount: number, currency = "USD") {
  let formatter = currencyFormatters.get(currency);
  if (!formatter) {
    formatter = new Intl.NumberFormat("en-US", { style: "currency", currency });
    currencyFormatters.set(currency, formatter);
  }
  return formatter.format(amount);
}

export function formatSignedCurrency(amount: number, currency = "USD") {
  const sign = amount > 0 ? "+" : amount < 0 ? "−" : "";
  return `${sign}${formatCurrency(Math.abs(amount), currency)}`;
}

export function formatPercent(ratio: number) {
  const sign = ratio > 0 ? "+" : ratio < 0 ? "−" : "";
  return `${sign}${Math.abs(ratio * 100).toFixed(2)}%`;
}

export function formatShares(shares: number) {
  return shares.toLocaleString("en-US", { maximumFractionDigits: 4 });
}

export function formatDate(date: Date) {
  return format(date, "MMM d, yyyy");
}

// Value for <input type="date">; parsed back with parseISO (local midnight).
export function toDateInputValue(date: Date) {
  return format(date, "yyyy-MM-dd");
}

const MONTHLY_FACTOR: Record<BillingCycle, number> = {
  WEEKLY: 52 / 12,
  MONTHLY: 1,
  ANNUAL: 1 / 12,
};

export function toMonthlyAmount(amount: number, cycle: BillingCycle) {
  return amount * MONTHLY_FACTOR[cycle];
}

export function advanceByCycle(date: Date, cycle: BillingCycle) {
  if (cycle === "WEEKLY") return addWeeks(date, 1);
  if (cycle === "ANNUAL") return addYears(date, 1);
  return addMonths(date, 1);
}

// A stored renewal date in the past rolls forward to the next upcoming occurrence.
export function upcomingRenewal(date: Date, cycle: BillingCycle, now = new Date()) {
  const today = startOfDay(now);
  let next = date;
  while (next < today) next = advanceByCycle(next, cycle);
  return next;
}
