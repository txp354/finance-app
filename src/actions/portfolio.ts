"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { holdingSchema } from "@/lib/schemas";
import { fetchStockClosePrice } from "@/lib/stock-service";

// Holdings also report whether the initial price lookup worked, so the UI can warn.
export type HoldingActionResult =
  | { success: true; priceError?: string }
  | { success: false; error: string };

function revalidate() {
  revalidatePath("/portfolio");
  revalidatePath("/");
}

export async function createHolding(input: unknown): Promise<HoldingActionResult> {
  const parsed = holdingSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }
  const { ticker, shares, costBasis } = parsed.data;

  const existing = await db.stockHolding.findUnique({ where: { ticker } });
  if (existing) return { success: false, error: `${ticker} is already in your portfolio` };

  // Reject unknown symbols; other lookup failures (e.g. offline) still save without a price.
  const price = await fetchStockClosePrice(ticker);
  if (!price.success && price.notFound) return { success: false, error: price.error };

  await db.stockHolding.create({
    data: {
      ticker,
      shares,
      costBasis: costBasis ?? null,
      ...(price.success && { lastClosePrice: price.price, currency: price.currency, lastFetchedAt: new Date() }),
    },
  });
  revalidate();
  return price.success ? { success: true } : { success: true, priceError: price.error };
}

export async function updateHolding(id: string, input: unknown): Promise<HoldingActionResult> {
  const parsed = holdingSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }
  const { ticker, shares, costBasis } = parsed.data;

  const current = await db.stockHolding.findUnique({ where: { id } });
  if (!current) return { success: false, error: "Holding not found" };

  const tickerChanged = current.ticker !== ticker;
  if (tickerChanged && (await db.stockHolding.findUnique({ where: { ticker } }))) {
    return { success: false, error: `${ticker} is already in your portfolio` };
  }
  const price = tickerChanged ? await fetchStockClosePrice(ticker) : null;
  if (price && !price.success && price.notFound) return { success: false, error: price.error };

  await db.stockHolding.update({
    where: { id },
    data: {
      ticker,
      shares,
      costBasis: costBasis ?? null,
      // A new ticker replaces the stored price (cleared if the lookup failed).
      ...(price &&
        (price.success
          ? { lastClosePrice: price.price, currency: price.currency, lastFetchedAt: new Date() }
          : { lastClosePrice: null, lastFetchedAt: null })),
    },
  });
  revalidate();
  return { success: true, priceError: price && !price.success ? price.error : undefined };
}

export async function deleteHolding(id: string): Promise<HoldingActionResult> {
  const { count } = await db.stockHolding.deleteMany({ where: { id } });
  if (count === 0) return { success: false, error: "Holding not found" };
  revalidate();
  return { success: true };
}
