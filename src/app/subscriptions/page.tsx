import type { Metadata } from "next";
import { differenceInCalendarDays } from "date-fns";
import { PageHeader } from "@/components/shared/page-header";
import { StatCard } from "@/components/shared/stat-card";
import { SubscriptionList, type SubscriptionRow } from "@/components/subscriptions/subscription-list";
import { db } from "@/lib/db";
import { formatCurrency, formatDate, toMonthlyAmount, upcomingRenewal } from "@/lib/utils";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Subscriptions · Finance Tracker" };

export default async function SubscriptionsPage() {
  const subscriptions = await db.subscription.findMany();
  const now = new Date();

  const rows: SubscriptionRow[] = subscriptions
    .map((s) => {
      const upcoming = upcomingRenewal(s.nextRenewalDate, s.billingCycle, now);
      return {
        ...s,
        monthlyAmount: toMonthlyAmount(s.amount, s.billingCycle),
        upcomingRenewal: upcoming,
        daysUntilRenewal: differenceInCalendarDays(upcoming, now),
      };
    })
    // Active first, then soonest renewal.
    .sort(
      (a, b) =>
        Number(b.isActive) - Number(a.isActive) ||
        a.upcomingRenewal.getTime() - b.upcomingRenewal.getTime(),
    );

  const active = rows.filter((s) => s.isActive);
  const monthlyTotal = active.reduce((sum, s) => sum + s.monthlyAmount, 0);
  const nextUp = active[0];

  return (
    <>
      <PageHeader title="Subscriptions" description="Recurring bills and services." />
      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <StatCard
          label="Monthly cost"
          value={formatCurrency(monthlyTotal)}
          hint={`${active.length} active of ${rows.length}`}
        />
        <StatCard label="Yearly cost" value={formatCurrency(monthlyTotal * 12)} hint="Active subscriptions" />
        <StatCard
          label="Next renewal"
          value={nextUp ? nextUp.name : "—"}
          hint={nextUp ? `${formatDate(nextUp.upcomingRenewal)} · ${formatCurrency(nextUp.amount)}` : "Nothing active"}
        />
      </div>
      <SubscriptionList subscriptions={rows} />
    </>
  );
}
