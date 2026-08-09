import { redis } from "../lib/redis";

export type Trade = {
  symbol: string;
  price: number;
  timestamp: number; // milliseconds, as Finnhub sends it
  volume: number;
};

export type Candle = {
  symbol: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  bucketStart: number; // unix seconds
};

const CANDLE_INTERVAL_SECONDS = 5;

// In-memory candle-in-progress per symbol. Not persisted until it "closes" —
// current state is still written to Redis on every trade so the frontend
// always has a live, up-to-date price to show.
const activeCandles = new Map<string, Candle>();

type OnCandleUpdate = (candle: Candle) => void;

export function processTrade(trade: Trade, onUpdate: OnCandleUpdate) {
  const tradeSeconds = Math.floor(trade.timestamp / 1000);
  const bucketStart = Math.floor(tradeSeconds / CANDLE_INTERVAL_SECONDS) * CANDLE_INTERVAL_SECONDS;

  let candle = activeCandles.get(trade.symbol);

  if (!candle || candle.bucketStart !== bucketStart) {
    // Previous candle (if any) has closed — persist it to Redis history before starting fresh
    if (candle) {
      persistClosedCandle(candle);
    }

    candle = {
      symbol: trade.symbol,
      open: trade.price,
      high: trade.price,
      low: trade.price,
      close: trade.price,
      volume: trade.volume,
      bucketStart,
    };
  } else {
    candle.high = Math.max(candle.high, trade.price);
    candle.low = Math.min(candle.low, trade.price);
    candle.close = trade.price;
    candle.volume += trade.volume;
  }

  activeCandles.set(trade.symbol, candle);

  // Live current-price cache — cheap, single key overwrite per trade
  redis.set(`price:${trade.symbol}`, JSON.stringify(candle)).catch((err) => {
    console.error(`[redis] Failed to write price:${trade.symbol}`, err);
  });

  onUpdate(candle);
}

async function persistClosedCandle(candle: Candle) {
  try {
    // Store closed candles in a sorted set, scored by bucketStart, for history/charting
    await redis.zadd(`history:${candle.symbol}`, {
      score: candle.bucketStart,
      member: JSON.stringify(candle),
    });
  } catch (err) {
    console.error(`[redis] Failed to persist closed candle for ${candle.symbol}`, err);
  }
}