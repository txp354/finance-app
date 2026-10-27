import YahooFinance from "yahoo-finance2";
import { db } from "@/lib/db";
import type { PriceFetchResult } from "@/types";

// yahoo-finance2 v3+ requires an instance instead of the default export.
const yahooFinance = new YahooFinance({ suppressNotices: ["yahooSurvey"] });

export async function fetchStockClosePrice(ticker: string): Promise<PriceFetchResult> {
  try {
    const quote = await yahooFinance.quote(ticker.toUpperCase());
    // Unknown symbols resolve to undefined rather than throwing.
    if (!quote) return { price: null, error: `Ticker "${ticker.toUpperCase()}" not found`, success: false, notFound: true };
    const price = quote.regularMarketPreviousClose ?? quote.regularMarketPrice;
    if (price == null) return { price: null, error: "No price returned", success: false };
    return { price, currency: quote.currency || "USD", success: true };
  } catch (error) {
    return { price: null, error: (error as Error).message, success: false };
  }
}

// Fetches and stores the latest close for one holding; returns the fetch result.
export async function refreshHoldingPrice(id: string, ticker: string) {
  const result = await fetchStockClosePrice(ticker);
  if (result.success) {
    await db.stockHolding.update({
      where: { id },
      data: { lastClosePrice: result.price, currency: result.currency, lastFetchedAt: new Date() },
    });
  }
  return result;
}
