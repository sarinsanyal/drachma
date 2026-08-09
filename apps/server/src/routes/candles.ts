import { Router } from "express";
import { redis } from "../lib/redis";

const router = Router();
const FINNHUB_API_KEY = process.env.FINNHUB_API_KEY;

const RESOLUTION_TTL: Record<string, number> = {
    "1": 60,        // 1m candles — cache 1 min
    "5": 60,        // 5m — cache 1 min
    "15": 120,      // 15m — cache 2 min
    "60": 300,      // 1h — cache 5 min
    "D": 3600,      // daily — cache 1 hour
    "W": 3600,
    "M": 86400,
};

router.get("/", async (req, res) => {
    const { symbol, resolution, from, to } = req.query as Record<string, string>;

    if (!symbol || !resolution || !from || !to) {
        res.status(400).json({ error: "symbol, resolution, from, to are required" });
        return;
    }

    const cacheKey = `candles:${symbol}:${resolution}:${from}:${to}`;

    try {
        const cached = await redis.get<string>(cacheKey);
        if (cached) {
            res.json(typeof cached === "string" ? JSON.parse(cached) : cached);
            return;
        }

        const url = `https://finnhub.io/api/v1/stock/candle?symbol=${symbol}&resolution=${resolution}&from=${from}&to=${to}&token=${FINNHUB_API_KEY}`;
        const response = await fetch(url);
        const data = await response.json();

        if (data.s === "no_data") {
            res.json({ candles: [] });
            return;
        }

        // Finnhub returns parallel arrays — zip into OHLCV objects
        const candles = data.t.map((t: number, i: number) => ({
            time: t,
            open: data.o[i],
            high: data.h[i],
            low: data.l[i],
            close: data.c[i],
            volume: data.v[i],
        }));

        const ttl = RESOLUTION_TTL[resolution] ?? 60;
        await redis.set(cacheKey, JSON.stringify({ candles }), { ex: ttl });

        res.json({ candles });
    } catch (err) {
        console.error("[candles] Failed:", err);
        res.status(500).json({ error: "Failed to fetch candles" });
    }
});

export default router;