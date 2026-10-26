export type {
  Transaction,
  Subscription,
  StockHolding,
  TransactionType,
  BillingCycle,
} from "@prisma/client";

export type PriceFetchResult =
  | { success: true; price: number; currency: string }
  | { success: false; price: null; error: string };
