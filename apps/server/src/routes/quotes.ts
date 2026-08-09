import { Router } from "express";
import { TRACKED_SYMBOLS, TICKER_NAMES } from "../config/symbols";
import { redis } from "../lib/redis";

const router = Router();
const FINNHUB_API_KEY = process.env.FINNHUB_API_KEY;
const CACHE_KEY = "quotes:all";
const CACHE_TTL_SECONDS = 60; // 1 min when market open, fine for closed too

const BATCH_SIZE = 10;
const BATCH_DELAY_MS = 1100; // stay comfortably under Finnhub burst limits

type FinnhubQuote = {
    c: number;
    pc: number;
    d: number;
    dp: number;
    h: number;
    l: number;
    o: number;
};

type QuoteData = {
    symbol: string;
    name: string;
    price: number;
    previousClose: number;
    change: number;
    changePct: number;
    high: number;
    low: number;
    open: number;
};

async function fetchQuote(symbol: string): Promise<[string, QuoteData] | null> {
    try {
        const res = await fetch(
            `https://finnhub.io/api/v1/quote?symbol=${symbol}&token=${FINNHUB_API_KEY}`
        );
        if (!res.ok) return null;
        const q: FinnhubQuote = await res.json();
        // Finnhub returns 0 for all fields if symbol is invalid
        if (!q.c) return null;
        return [symbol, {
            symbol,
            name: TICKER_NAMES[symbol] ?? symbol,
            price: q.c,
            previousClose: q.pc,
            change: q.d,
            changePct: q.dp,
            high: q.h,
            low: q.l,
            open: q.o,
        }] as [string, QuoteData];
    } catch {
        return null;
    }
}

async function fetchAllFromFinnhub(): Promise<Record<string, QuoteData>> {
    const results: ([string, QuoteData] | null)[] = [];

    for (let i = 0; i < TRACKED_SYMBOLS.length; i += BATCH_SIZE) {
        const batch = TRACKED_SYMBOLS.slice(i, i + BATCH_SIZE);
        const batchResults = await Promise.all(batch.map(fetchQuote));
        results.push(...batchResults);

        if (i + BATCH_SIZE < TRACKED_SYMBOLS.length) {
            await new Promise((r) => setTimeout(r, BATCH_DELAY_MS));
        }
    }

    // retry any that failed once, after the main pass
    const failedSymbols = TRACKED_SYMBOLS.filter((_, idx) => results[idx] === null);
    if (failedSymbols.length > 0) {
        await new Promise((r) => setTimeout(r, BATCH_DELAY_MS));
        const retried = await Promise.all(failedSymbols.map(fetchQuote));
        results.push(...retried);
    }

    return Object.fromEntries(results.filter(Boolean) as [string, QuoteData][]);
}

router.get("/", async (_req, res) => {
    if (!FINNHUB_API_KEY) {
        res.status(500).json({ error: "FINNHUB_API_KEY not configured" });
        return;
    }

    try {
        // Try cache first
        const cached = await redis.get<string>(CACHE_KEY);
        if (cached) {
            res.json(typeof cached === "string" ? JSON.parse(cached) : cached);
            return;
        }

        // Cache miss — fetch from Finnhub and store
        const quotes = await fetchAllFromFinnhub();
        await redis.set(CACHE_KEY, JSON.stringify(quotes), { ex: CACHE_TTL_SECONDS });
        res.json(quotes);
    } catch (err) {
        console.error("[quotes] Redis error, falling back to direct fetch:", err);
        // Redis down — still serve data, just uncached
        const quotes = await fetchAllFromFinnhub();
        res.json(quotes);
    }
});

export async function warmQuoteCache() {
    if (!FINNHUB_API_KEY) return;
    try {
        const quotes = await fetchAllFromFinnhub();
        await redis.set(CACHE_KEY, JSON.stringify(quotes), { ex: CACHE_TTL_SECONDS });
        console.log("[quotes] Cache warmed —", Object.keys(quotes).length, "symbols");
    } catch (err) {
        console.error("[quotes] Cache warm failed:", err);
    }
}

export default router;