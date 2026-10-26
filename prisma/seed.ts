import { PrismaClient, TransactionType, BillingCycle } from "@prisma/client";
import { addDays, addMonths, addYears, startOfMonth, subMonths } from "date-fns";

const prisma = new PrismaClient();

// Monthly expense templates: [category, description, amount, day of month]
const monthlyExpenses: [string, string, number, number][] = [
  ["Rent", "Monthly rent", 1650, 1],
  ["Utilities", "Electric & water", 118.4, 8],
  ["Utilities", "Internet", 65, 12],
  ["Groceries", "Weekly groceries", 142.35, 3],
  ["Groceries", "Weekly groceries", 98.2, 10],
  ["Groceries", "Weekly groceries", 121.75, 17],
  ["Groceries", "Weekly groceries", 87.6, 24],
  ["Food", "Dinner out", 64.5, 6],
  ["Food", "Coffee & lunch", 23.8, 14],
  ["Food", "Takeout", 38.9, 21],
  ["Transport", "Gas", 52.3, 9],
  ["Transport", "Transit pass", 45, 2],
  ["Entertainment", "Concert tickets", 85, 19],
  ["Subscriptions", "Netflix", 15.49, 5],
  ["Subscriptions", "Spotify", 11.99, 15],
  ["Subscriptions", "Gym membership", 39.99, 1],
];

async function main() {
  await prisma.transaction.deleteMany();
  await prisma.subscription.deleteMany();
  await prisma.stockHolding.deleteMany();

  const now = new Date();
  const transactions = [];

  // Current month plus the previous two months, skipping future-dated entries.
  for (let m = 2; m >= 0; m--) {
    const monthStart = startOfMonth(subMonths(now, m));

    for (const day of [1, 15]) {
      const date = addDays(monthStart, day - 1);
      if (date > now) continue;
      transactions.push({
        type: TransactionType.INCOME,
        amount: 2850,
        category: "Salary",
        description: "Paycheck",
        date,
      });
    }

    if (m === 1) {
      transactions.push({
        type: TransactionType.INCOME,
        amount: 400,
        category: "Freelance",
        description: "Side project",
        date: addDays(monthStart, 20),
      });
    }

    for (const [category, description, amount, day] of monthlyExpenses) {
      const date = addDays(monthStart, day - 1);
      if (date > now) continue;
      transactions.push({ type: TransactionType.EXPENSE, amount, category, description, date });
    }
  }

  await prisma.transaction.createMany({ data: transactions });

  const nextMonth = startOfMonth(addMonths(now, 1));
  await prisma.subscription.createMany({
    data: [
      { name: "Netflix", amount: 15.49, nextRenewalDate: addDays(nextMonth, 4) },
      { name: "Spotify", amount: 11.99, nextRenewalDate: addDays(nextMonth, 14) },
      { name: "Gym", amount: 39.99, category: "Health", nextRenewalDate: nextMonth },
      { name: "Internet", amount: 65, category: "Utilities", nextRenewalDate: addDays(nextMonth, 11) },
      {
        name: "Amazon Prime",
        amount: 139,
        billingCycle: BillingCycle.ANNUAL,
        nextRenewalDate: addYears(startOfMonth(now), 1),
      },
    ],
  });

  await prisma.stockHolding.createMany({
    data: [
      { ticker: "AAPL", shares: 12, costBasis: 172.5 },
      { ticker: "NVDA", shares: 8.5, costBasis: 118.2 },
      { ticker: "VOO", shares: 6.25, costBasis: 465.8 },
      { ticker: "MSFT", shares: 4, costBasis: 395.1 },
    ],
  });

  const [t, s, h] = await Promise.all([
    prisma.transaction.count(),
    prisma.subscription.count(),
    prisma.stockHolding.count(),
  ]);
  console.log(`Seeded ${t} transactions, ${s} subscriptions, ${h} holdings.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
