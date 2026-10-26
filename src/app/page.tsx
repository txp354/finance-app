import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

// Phase 1 placeholder: confirms Prisma, Tailwind and shadcn are wired up.
// Replaced by the dashboard in Phase 4.
export default async function Home() {
  const [transactions, subscriptions, holdings] = await Promise.all([
    db.transaction.count(),
    db.subscription.count(),
    db.stockHolding.count(),
  ]);

  return (
    <main className="mx-auto flex min-h-screen max-w-xl flex-col justify-center gap-6 p-6">
      <Card>
        <CardHeader>
          <CardTitle>Finance Tracker: setup complete</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <ul className="text-muted-foreground space-y-1 text-sm">
            <li>Transactions: {transactions}</li>
            <li>Subscriptions: {subscriptions}</li>
            <li>Holdings: {holdings}</li>
          </ul>
          <Button>shadcn Button</Button>
        </CardContent>
      </Card>
    </main>
  );
}
