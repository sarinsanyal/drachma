import { Router } from "express";
import { redis } from "../lib/redis";
import { requireAuth, AuthedRequest } from "../middleware/auth";
import { supabaseForUser } from "../lib/supabase";

const router = Router();

router.post("/", requireAuth, async (req: AuthedRequest, res) => {
  const { symbol, quantity, type } = req.body;

  if (!symbol || typeof symbol !== "string") {
    return res.status(400).json({ error: "Symbol is required" });
  }
  if (!Number.isInteger(quantity) || quantity <= 0) {
    return res.status(400).json({ error: "Quantity must be a positive integer" });
  }
  if (type !== "buy" && type !== "sell") {
    return res.status(400).json({ error: "Type must be 'buy' or 'sell'" });
  }

  const normalizedSymbol = symbol.trim().toUpperCase();
  let price: number | null = null;

  // Primary: tick-fresh price written by the candle aggregator
  try {
    const cached = await redis.get<string>(`price:${normalizedSymbol}`);
    if (cached) {
      const candle = typeof cached === "string" ? JSON.parse(cached) : cached;
      price = candle.close;
    }
  } catch (err) {
    console.error(`[trade] Failed to read price:${normalizedSymbol}`, err);
  }

  // Fallback: batched quote cache (market closed / no ticks yet)
  if (!price) {
    try {
      const cachedQuotes = await redis.get<string>("quotes:all");
      if (cachedQuotes) {
        const quotes = typeof cachedQuotes === "string" ? JSON.parse(cachedQuotes) : cachedQuotes;
        price = quotes[normalizedSymbol]?.price ?? null;
      }
    } catch (err) {
      console.error("[trade] Failed to read quotes:all fallback", err);
    }
  }

  if (!price || price <= 0) {
    return res.status(404).json({ error: `No live price available for ${normalizedSymbol}` });
  }

  const supabase = supabaseForUser(req.accessToken!);

  const { data, error } = await supabase.rpc("execute_trade", {
    p_symbol: normalizedSymbol,
    p_quantity: quantity,
    p_price: price,
    p_type: type,
  });

  if (error) {
    return res.status(400).json({ error: error.message });
  }

  res.json({ trade: data });
});

export default router;