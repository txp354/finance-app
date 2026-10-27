import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { refreshHoldingPrice } from "@/lib/stock-service";
import type { RefreshResponse } from "@/types";

// Updates lastClosePrice / lastFetchedAt for every holding.
export async function POST() {
  const holdings = await db.stockHolding.findMany({ select: { id: true, ticker: true } });

  const results = await Promise.all(
    holdings.map(async (h) => ({ ticker: h.ticker, result: await refreshHoldingPrice(h.id, h.ticker) })),
  );

  const body: RefreshResponse = { updated: 0, failed: [] };
  for (const { ticker, result } of results) {
    if (result.success) body.updated++;
    else body.failed.push({ ticker, error: result.error });
  }

  revalidatePath("/portfolio");
  revalidatePath("/");
  return NextResponse.json(body);
}
