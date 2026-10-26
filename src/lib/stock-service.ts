import YahooFinance from "yahoo-finance2";

// yahoo-finance2 v3+ requires an instance instead of the default export.
const yahooFinance = new YahooFinance();

export async function fetchStockClosePrice(ticker: string) {
  try {
    const quote = await yahooFinance.quote(ticker.toUpperCase());
    return {
      price: quote.regularMarketPreviousClose ?? quote.regularMarketPrice ?? 0,
      currency: quote.currency || "USD",
      success: true,
    };
  } catch (error) {
    return { price: null, error: (error as Error).message, success: false };
  }
}
