import WebSocket from "ws";
import dotenv from "dotenv";
import { TRACKED_SYMBOLS } from "../config/symbols";
import { processTrade, type Trade } from "../services/candleAggregator";

dotenv.config();

const FINNHUB_API_KEY = process.env.FINNHUB_API_KEY;

if (!FINNHUB_API_KEY) {
  throw new Error("FINNHUB_API_KEY is not set in .env");
}

type Tick = {
  symbol: string;
  price: number;
  timestamp: number;
  volume: number;
};

export function connectFinnhub(
  onCandleUpdate: (candle: any) => void,
  onTickUpdate?: (tick: Tick) => void
) {
  const ws = new WebSocket(`wss://ws.finnhub.io?token=${FINNHUB_API_KEY}`);

  ws.on("open", () => {
    console.log("[finnhub] Connected");
    TRACKED_SYMBOLS.forEach((symbol) => {
      ws.send(JSON.stringify({ type: "subscribe", symbol }));
    });
  });

  ws.on("message", (raw) => {
    const msg = JSON.parse(raw.toString());
    if (msg.type !== "trade" || !Array.isArray(msg.data)) return;

    for (const t of msg.data) {
      const trade: Trade = {
        symbol: t.s,
        price: t.p,
        timestamp: t.t,
        volume: t.v,
      };

      // Broadcast raw tick immediately — no aggregation delay
      onTickUpdate?.({ symbol: t.s, price: t.p, timestamp: t.t, volume: t.v });

      // Aggregate into candles for history/charting
      processTrade(trade, onCandleUpdate);
    }
  });

  ws.on("error", (err) => {
    console.error("[finnhub] WebSocket error:", err.message);
  });

  ws.on("close", () => {
    console.warn("[finnhub] Connection closed — reconnecting in 5s");
    setTimeout(() => connectFinnhub(onCandleUpdate, onTickUpdate), 5000);
  });

  return ws;
}