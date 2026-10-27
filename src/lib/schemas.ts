import { z } from "zod";

// Shared by client forms (zodResolver) and server actions (re-validation).

const dateString = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Pick a date");

const positiveAmount = z
  .number({ error: "Enter an amount" })
  .positive("Must be greater than 0");

export const TRANSACTION_CATEGORIES = {
  INCOME: ["Salary", "Freelance", "Investments", "Gifts", "Other"],
  EXPENSE: [
    "Rent",
    "Groceries",
    "Food",
    "Utilities",
    "Transport",
    "Subscriptions",
    "Entertainment",
    "Health",
    "Shopping",
    "Other",
  ],
} as const;

export const transactionSchema = z.object({
  type: z.enum(["INCOME", "EXPENSE"]),
  amount: positiveAmount,
  category: z.string().trim().min(1, "Pick a category").max(50),
  description: z.string().trim().max(200).optional(),
  date: dateString,
});
export type TransactionInput = z.infer<typeof transactionSchema>;

export const SUBSCRIPTION_CATEGORIES = [
  "Subscriptions",
  "Utilities",
  "Health",
  "Rent",
  "Insurance",
  "Other",
] as const;

export const subscriptionSchema = z.object({
  name: z.string().trim().min(1, "Enter a name").max(80),
  amount: positiveAmount,
  billingCycle: z.enum(["WEEKLY", "MONTHLY", "ANNUAL"]),
  category: z.string().trim().min(1, "Pick a category").max(50),
  nextRenewalDate: dateString,
  isActive: z.boolean(),
});
export type SubscriptionInput = z.infer<typeof subscriptionSchema>;

export const holdingSchema = z.object({
  ticker: z
    .string()
    .trim()
    .min(1, "Enter a ticker")
    .max(12)
    .regex(/^[A-Za-z0-9.\-^=]+$/, "Letters, numbers, . - ^ = only")
    .transform((t) => t.toUpperCase()),
  shares: z.number({ error: "Enter a share count" }).positive("Must be greater than 0"),
  costBasis: z
    .number()
    .nonnegative("Can't be negative")
    .optional(),
});
export type HoldingInput = z.input<typeof holdingSchema>;

export type ActionResult = { success: true } | { success: false; error: string };
