import type { Metadata } from "next";
import { PageHeader } from "@/components/shared/page-header";
import { TransactionTable } from "@/components/transactions/transaction-table";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Transactions · Finance Tracker" };

export default async function TransactionsPage() {
  const transactions = await db.transaction.findMany({
    orderBy: [{ date: "desc" }, { createdAt: "desc" }],
  });

  return (
    <>
      <PageHeader title="Transactions" description="Your income and expenses." />
      <TransactionTable transactions={transactions} />
    </>
  );
}
