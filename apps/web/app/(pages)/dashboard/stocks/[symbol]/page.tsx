"use client";

import { useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useLivePrices } from "@/lib/hooks/useLivePrices";
import DashboardNavbar from "@/components/custom/dashboard/Navbar";
import {
    createChart,
    ColorType,
    CrosshairMode,
    CandlestickSeries,
    type IChartApi,
    type ISeriesApi,
    type CandlestickData,
    type Time,
} from "lightweight-charts";
import { FiArrowLeft, FiTrendingUp, FiTrendingDown } from "react-icons/fi";
import { FaHeart, FaRegHeart } from "react-icons/fa";
import { toast, Toaster } from "sonner";
import { getMarketStatus } from "@/lib/hooks/market";

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

function formatCurrency(n: number) {
    return n.toLocaleString(undefined, { style: "currency", currency: "USD" });
}

type Tone = "neutral" | "green" | "red" | "purple" | "white";

const TONE_CLASSES: Record<Tone, string> = {
    neutral: "text-white",
    green: "text-green-400",
    red: "text-red-400",
    purple: "text-purple-400",
    white: "text-white"
};

function MetricCard({ label, value, sub, tone = "neutral" }: { label: string; value: string; sub?: string; tone?: Tone }) {
    return (
        <div className="bg-white/5 border border-white/10 rounded-xl p-4">
            <p className="text-white/40 text-xs mb-1">{label}</p>
            <p className={`font-bold text-lg ${TONE_CLASSES[tone]}`}>{value}</p>
            {sub && <p className="text-white/30 text-xs mt-0.5">{sub}</p>}
        </div>
    );
}

function StockDetailSkeleton() {
    return (
        <div className="min-h-screen text-white">
            <DashboardNavbar />
            <div className="px-4 py-6 md:px-8 lg:px-16">
                <div className="max-w-6xl mx-auto animate-pulse">

                    <div className="h-4 w-32 bg-white/10 rounded mb-6" />

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                        {/* Left column */}
                        <div className="lg:col-span-2 flex flex-col gap-6">

                            {/* Price header */}
                            <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
                                <div className="flex items-start justify-between">
                                    <div>
                                        <div className="flex items-center gap-3 mb-1">
                                            <div className="w-10 h-10 rounded-xl bg-white/10" />
                                            <div>
                                                <div className="h-5 w-16 bg-white/10 rounded mb-2" />
                                                <div className="h-3 w-24 bg-white/10 rounded" />
                                            </div>
                                        </div>
                                        <div className="h-9 w-40 bg-white/10 rounded mt-3" />
                                        <div className="h-4 w-32 bg-white/10 rounded mt-2" />
                                    </div>
                                    <div className="w-8 h-8 rounded-lg bg-white/10" />
                                </div>
                            </div>

                            {/* Chart */}
                            <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
                                <div className="flex items-center justify-between mb-4">
                                    <div className="h-4 w-24 bg-white/10 rounded" />
                                    <div className="h-3 w-28 bg-white/10 rounded" />
                                </div>
                                <div className="w-full h-72 bg-white/5 rounded-xl" />
                            </div>

                            {/* Metrics */}
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                                {Array.from({ length: 6 }).map((_, i) => (
                                    <div key={i} className="bg-white/5 border border-white/10 rounded-xl p-4">
                                        <div className="h-3 w-12 bg-white/10 rounded mb-2" />
                                        <div className="h-5 w-20 bg-white/10 rounded" />
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Right — order panel */}
                        <div className="flex flex-col gap-4">
                            <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
                                <div className="h-4 w-20 bg-white/10 rounded mb-4" />
                                <div className="h-10 w-full bg-white/10 rounded-xl mb-5" />
                                <div className="h-3 w-16 bg-white/10 rounded mb-2" />
                                <div className="h-9 w-full bg-white/10 rounded-lg mb-4" />
                                <div className="h-24 w-full bg-white/5 rounded-xl mb-4" />
                                <div className="h-12 w-full bg-white/10 rounded-xl" />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default function StockDetailPage() {
    const { symbol } = useParams<{ symbol: string }>();
    const router = useRouter();
    const supabase = createClient();
    const { prices: livePrices, ticks, connected } = useLivePrices();

    const chartContainerRef = useRef<HTMLDivElement>(null);
    const chartRef = useRef<IChartApi | null>(null);
    const seriesRef = useRef<ISeriesApi<"Candlestick"> | null>(null);
    const lastCandleRef = useRef<CandlestickData | null>(null);

    const [quote, setQuote] = useState<QuoteData | null>(null);
    const [watched, setWatched] = useState(false);
    const [userId, setUserId] = useState<string | null>(null);
    const [qty, setQty] = useState(1);
    const [loading, setLoading] = useState(true);
    const [orderType, setOrderType] = useState<"buy" | "sell">("buy");
    const [submitting, setSubmitting] = useState(false);
    const [holding, setHolding] = useState<{ qty: number; avgCost: number } | null>(null);
    const [market, setMarket] = useState(() => getMarketStatus());

    useEffect(() => {
        const interval = setInterval(() => setMarket(getMarketStatus()), 60_000);
        return () => clearInterval(interval);
    }, []);

    const marketOpen = market.isOpen;

    const fetchHolding = async (uid: string) => {
        const { data } = await supabase
            .from("trades")
            .select("quantity, price, type")
            .eq("profile_id", uid)
            .eq("symbol", symbol);

        if (!data || data.length === 0) { setHolding(null); return; }

        let qty = 0;
        let totalCost = 0;
        let avgCost = 0;

        for (const t of data) {
            if (t.type === "buy") {
                totalCost += t.price * t.quantity;
                qty += t.quantity;
                avgCost = totalCost / qty;
            } else {
                totalCost -= avgCost * t.quantity;
                qty -= t.quantity;
            }
        }

        setHolding(qty > 0 ? { qty, avgCost } : null);
    };
    const handleTrade = async () => {
        // Block if market closed
        if (!marketOpen) {
            toast.error("Market is closed. Trading is only available during market hours.");
            return;
        }

        setSubmitting(true);
        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) {
                toast.error("You need to be logged in to trade.");
                return;
            }
            if (orderType === "sell") {
                const currentQty = holding?.qty ?? 0;
                if (currentQty === 0) {
                    toast.error("You don't hold any shares of this stock.");
                    setSubmitting(false);
                    return;
                }
                if (qty > currentQty) {
                    toast.error(`You only hold ${currentQty} share${currentQty > 1 ? "s" : ""}. Can't sell ${qty}.`);
                    setSubmitting(false);
                    return;
                }
            }
            const res = await fetch(`${process.env.NEXT_PUBLIC_SERVER_URL}/api/trade`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${session.access_token}`,
                },
                body: JSON.stringify({ symbol, quantity: qty, type: orderType }),
            });

            const data = await res.json();

            if (!res.ok) {
                toast.error(data.error || "Trade failed");
                return;
            }

            toast.success(`${orderType === "buy" ? "Bought" : "Sold"} ${qty} share${qty > 1 ? "s" : ""} of ${symbol}`);
            setQty(1);
            if (userId) await fetchHolding(userId);
        } catch (err) {
            console.error("[trade] Failed:", err);
            toast.error("Something went wrong placing the trade");
        } finally {
            setSubmitting(false);
        }
    };

    const livePrice = marketOpen
        ? (ticks[symbol] ?? livePrices[symbol]?.close ?? quote?.price ?? 0)
        : (quote?.price ?? 0);

    const change = quote ? (marketOpen ? livePrice - quote.previousClose : quote.change) : 0;
    const changePct = quote?.previousClose ? (change / quote.previousClose) * 100 : 0;
    const up = change >= 0;

    // Fetch user + watchlist status
    useEffect(() => {
        const init = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;
            setUserId(user.id);

            const { data } = await supabase
                .from("watchlist")
                .select("symbol")
                .eq("user_id", user.id)
                .eq("symbol", symbol)
                .single();

            setWatched(!!data);
            await fetchHolding(user.id);
        };
        init();
    }, [symbol]);

    // Fetch quote
    useEffect(() => {
        const fetchQuote = async () => {
            try {
                const res = await fetch(`${process.env.NEXT_PUBLIC_SERVER_URL}/quotes`);
                if (!res.ok) throw new Error(`HTTP ${res.status}`);
                const data: Record<string, QuoteData> = await res.json();
                if (data[symbol]) setQuote(data[symbol]);
            } catch (err) {
                console.error("[quote] Failed:", err);
            } finally {
                setLoading(false);
            }
        };
        fetchQuote();
    }, [symbol]);

    // Chart
    useEffect(() => {
        if (!chartContainerRef.current) return;

        const chart = createChart(chartContainerRef.current, {
            layout: {
                background: { type: ColorType.Solid, color: "transparent" },
                textColor: "rgba(255,255,255,0.4)",
                fontFamily: "inherit",
            },
            grid: {
                vertLines: { color: "rgba(255,255,255,0.04)" },
                horzLines: { color: "rgba(255,255,255,0.04)" },
            },
            crosshair: {
                mode: CrosshairMode.Normal,
                vertLine: { color: "rgba(255,255,255,0.2)", labelBackgroundColor: "#2d2d2d" },
                horzLine: { color: "rgba(255,255,255,0.2)", labelBackgroundColor: "#2d2d2d" },
            },
            rightPriceScale: { borderColor: "rgba(255,255,255,0.08)" },
            timeScale: {
                borderColor: "rgba(255,255,255,0.08)",
                timeVisible: true,
                secondsVisible: false,
            },
        });

        chartRef.current = chart;

        const series = chart.addSeries(CandlestickSeries, {
            upColor: "#22c55e",
            downColor: "#ef4444",
            borderUpColor: "#22c55e",
            borderDownColor: "#ef4444",
            wickUpColor: "#22c55e",
            wickDownColor: "#ef4444",
        });

        seriesRef.current = series;

        // Seed with simulated historical candles
        const now = Math.floor(Date.now() / 1000);
        const candles: CandlestickData[] = [];
        let price = quote?.price ?? 150;

        for (let i = 80; i >= 0; i--) {
            const open = +(price + (Math.random() - 0.5) * 2).toFixed(2);
            const close = +(open + (Math.random() - 0.5) * 3).toFixed(2);
            const high = +(Math.max(open, close) + Math.random() * 1.5).toFixed(2);
            const low = +(Math.min(open, close) - Math.random() * 1.5).toFixed(2);
            price = close;
            candles.push({ time: (now - i * 5 * 60) as Time, open, high, low, close });
        }

        series.setData(candles);
        lastCandleRef.current = candles[candles.length - 1];
        chart.timeScale().fitContent();

        const ro = new ResizeObserver(() => {
            if (chartContainerRef.current) {
                chart.applyOptions({ width: chartContainerRef.current.clientWidth });
            }
        });
        ro.observe(chartContainerRef.current);

        return () => {
            ro.disconnect();
            chart.remove();
        };
    }, [quote]);

    // Update chart from live ticks
    useEffect(() => {
        if (!seriesRef.current || !lastCandleRef.current) return;
        const lp = ticks[symbol];
        if (!lp || !marketOpen) return;

        const now = Math.floor(Date.now() / 1000);
        const bucketStart = Math.floor(now / 300) * 300 as Time;
        const last = lastCandleRef.current;

        const updated: CandlestickData = last.time === bucketStart
            ? {
                time: bucketStart,
                open: last.open,
                high: Math.max(last.high, lp),
                low: Math.min(last.low, lp),
                close: lp,
            }
            : {
                time: bucketStart,
                open: last.close,
                high: lp,
                low: lp,
                close: lp,
            };

        seriesRef.current.update(updated);
        lastCandleRef.current = updated;
    }, [ticks[symbol]]);

    const toggleWatchlist = async () => {
        if (!userId) return;
        const nowWatched = !watched; 
        setWatched(nowWatched);

        if (!nowWatched) {
            await supabase.from("watchlist").delete()
                .eq("user_id", userId).eq("symbol", symbol);
        } else {
            await supabase.from("watchlist").insert({ user_id: userId, symbol });
        }
    };

    if (loading) {
        return <StockDetailSkeleton />;
    }

    if (!quote) {
        return (
            <div className="min-h-screen text-white flex items-center justify-center">
                <p className="text-white/40 text-sm">Symbol not found.</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen text-white">
            <DashboardNavbar />
            <Toaster />

            <div className="px-4 py-6 md:px-8 lg:px-16">
                <div className="max-w-6xl mx-auto">

                    {/* Back */}
                    <button
                        onClick={() => router.back()}
                        className="flex items-center gap-2 text-white/40 hover:text-white text-sm mb-6 transition-colors"
                    >
                        <FiArrowLeft size={16} /> Back to Markets
                    </button>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                        {/* Left — chart + metrics */}
                        <div className="lg:col-span-2 flex flex-col gap-6">

                            {/* Price header */}
                            <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
                                <div className="flex items-start justify-between">
                                    <div>
                                        <div className="flex items-center gap-3 mb-1">
                                            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-sm font-bold">
                                                {symbol.slice(0, 2)}
                                            </div>
                                            <div>
                                                <h1 className="text-xl font-extrabold">{symbol}</h1>
                                                <p className="text-white/40 text-xs">{quote.name}</p>
                                            </div>
                                        </div>
                                        <p className="text-4xl font-extrabold mt-3 tabular-nums">
                                            {formatCurrency(livePrice)}
                                        </p>
                                        <div className={`flex items-center gap-1.5 mt-1 text-sm font-medium ${up ? "text-green-400" : "text-red-400"}`}>
                                            {up ? <FiTrendingUp size={14} /> : <FiTrendingDown size={14} />}
                                            {up ? "+" : ""}{change.toFixed(2)} ({up ? "+" : ""}{changePct.toFixed(2)}%) today
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <div className="flex items-center gap-1.5 text-xs">
                                            <span className={`w-1.5 h-1.5 rounded-full ${connected && marketOpen ? "bg-green-400" : "bg-white/30"}`} />
                                            <span className={connected && marketOpen ? "text-green-400" : "text-white/30"}>
                                                {marketOpen ? "Market Live" : "Market Closed"}
                                            </span>
                                        </div>
                                        <button
                                            onClick={toggleWatchlist}
                                            className="p-2 rounded-lg hover:bg-white/10 transition-colors"
                                        >
                                            {watched
                                                ? <FaHeart size={18} className="text-red-400" />
                                                : <FaRegHeart size={18} className="text-white/30" />
                                            }
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* Chart */}
                            <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
                                <div className="flex items-center justify-between mb-4">
                                    <h2 className="text-sm font-bold text-white/70">Price Chart</h2>
                                    <span className="text-xs text-white/30">5m candles · simulated history</span>
                                </div>
                                <div ref={chartContainerRef} className="w-full h-72" />
                            </div>

                            {/* Metrics */}
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                                <MetricCard label="Open" value={formatCurrency(quote.open)} tone="white" />
                                <MetricCard label="Prev Close" value={formatCurrency(quote.previousClose)} tone="white" />
                                <MetricCard label="Day High" value={formatCurrency(quote.high)} tone="green" />
                                <MetricCard label="Day Low" value={formatCurrency(quote.low)} tone="red" />
                                <MetricCard
                                    label="Change"
                                    value={`${up ? "+" : ""}${change.toFixed(2)}`}
                                    sub={`${up ? "+" : ""}${changePct.toFixed(2)}%`}
                                    tone={up ? "green" : "red"}
                                />
                                <MetricCard
                                    label="Market"
                                    value={marketOpen ? "Open" : "Closed"}
                                    sub="NYSE / NASDAQ"
                                    tone={marketOpen ? "green" : "red"}
                                />
                            </div>
                        </div>

                        {/* Right — buy/sell panel */}
                        <div className="flex flex-col gap-4">
                            <div className="bg-white/5 border border-white/10 rounded-2xl p-6 sticky top-6">
                                <h2 className="text-sm font-bold text-white/70 mb-4">Place Order</h2>

                                {/* Current holding */}
                                {holding && (
                                    <div className="bg-white/5 border border-white/10 rounded-xl p-4 mb-4">
                                        <p className="text-xs text-white/40 mb-2">Your Position</p>
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <p className="text-sm font-bold text-white">{holding.qty} shares</p>
                                                <p className="text-xs text-white/40">avg {formatCurrency(holding.avgCost)}</p>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-sm font-bold text-white tabular-nums">
                                                    {formatCurrency(holding.qty * livePrice)}
                                                </p>
                                                {(() => {
                                                    const pnl = (livePrice - holding.avgCost) * holding.qty;
                                                    const pnlUp = pnl >= 0;
                                                    return (
                                                        <p className={`text-xs font-medium ${pnlUp ? "text-green-400" : "text-red-400"}`}>
                                                            {pnlUp ? "+" : ""}{formatCurrency(pnl)}
                                                        </p>
                                                    );
                                                })()}
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Buy/Sell tabs */}
                                <div className="flex rounded-xl overflow-hidden border border-white/10 mb-5">
                                    <button
                                        onClick={() => setOrderType("buy")}
                                        disabled={!marketOpen}
                                        className={`flex-1 py-2.5 text-sm font-semibold border-r border-white/10 transition-colors ${orderType === "buy" ? "bg-green-500/20 text-green-400" : "text-white/40 hover:text-white hover:bg-white/5"} ${!marketOpen ? "opacity-40 cursor-not-allowed" : ""}`}
                                    >
                                        Buy
                                    </button>
                                    <button
                                        onClick={() => setOrderType("sell")}
                                        disabled={!holding || !marketOpen}
                                        className={`flex-1 py-2.5 text-sm font-semibold transition-colors ${orderType === "sell" ? "bg-red-500/20 text-red-400" : "text-white/40 hover:text-white hover:bg-white/5"} ${(!holding || !marketOpen) ? "opacity-40 cursor-not-allowed" : ""}`}
                                    >
                                        Sell
                                    </button>
                                </div>

                                {/* Qty */}
                                <div className="mb-4">
                                    <div className="flex items-center justify-between mb-2">
                                        <p className="text-xs text-white/40">Quantity</p>
                                        {orderType === "sell" && holding && (
                                            <button
                                                onClick={() => setQty(holding.qty)}
                                                disabled={!marketOpen}
                                                className={`text-xs text-purple-400 hover:text-purple-300 transition-colors ${!marketOpen ? "opacity-40 cursor-not-allowed" : ""}`}
                                            >
                                                Max ({holding.qty})
                                            </button>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={() => setQty(q => Math.max(1, q - 1))}
                                            disabled={!marketOpen}
                                            className={`w-9 h-9 rounded-lg bg-white/10 hover:bg-white/20 transition-colors text-white font-bold ${!marketOpen ? "opacity-40 cursor-not-allowed" : ""}`}
                                        >
                                            −
                                        </button>
                                        <input
                                            type="number"
                                            min={1}
                                            max={orderType === "sell" ? holding?.qty : undefined}
                                            value={qty}
                                            onChange={e => setQty(Math.max(1, Number(e.target.value)))}
                                            disabled={!marketOpen}
                                            className={`flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-center text-white text-sm focus:outline-none focus:border-purple-500 ${!marketOpen ? "opacity-40 cursor-not-allowed" : ""}`}
                                        />
                                        <button
                                            onClick={() => setQty(q => orderType === "sell" && holding ? Math.min(q + 1, holding.qty) : q + 1)}
                                            disabled={!marketOpen}
                                            className={`w-9 h-9 rounded-lg bg-white/10 hover:bg-white/20 transition-colors text-white font-bold ${!marketOpen ? "opacity-40 cursor-not-allowed" : ""}`}
                                        >
                                            +
                                        </button>
                                    </div>
                                </div>

                                {/* Order summary */}
                                <div className="bg-white/3 rounded-xl p-4 mb-4 flex flex-col gap-2">
                                    <div className="flex justify-between text-xs">
                                        <span className="text-white/40">Price per share</span>
                                        <span className="text-white tabular-nums">{formatCurrency(livePrice)}</span>
                                    </div>
                                    <div className="flex justify-between text-xs">
                                        <span className="text-white/40">Quantity</span>
                                        <span className="text-white">{qty}</span>
                                    </div>
                                    <div className="border-t border-white/10 pt-2 flex justify-between text-sm font-bold">
                                        <span className="text-white/70">Total</span>
                                        <span className="text-white tabular-nums">{formatCurrency(livePrice * qty)}</span>
                                    </div>
                                </div>

                                <button
                                    onClick={handleTrade}
                                    disabled={submitting || !marketOpen}
                                    className={`w-full py-3 rounded-xl font-bold text-sm border transition-colors ${orderType === "buy"
                                        ? "bg-green-500/30 text-green-400 border-green-500/20 hover:bg-green-500/40"
                                        : "bg-red-500/30 text-red-400 border-red-500/20 hover:bg-red-500/40"
                                        } ${(submitting || !marketOpen) ? "opacity-50 cursor-not-allowed" : ""}`}
                                >
                                    {!marketOpen ? "Market Closed" : submitting ? "Placing order..." : `${orderType === "buy" ? "Buy" : "Sell"} ${symbol}`}
                                </button>
                                {!marketOpen && (
                                    <p className="text-center text-xs text-white/30 mt-2">Trading is only available during market hours (9:30 AM – 4:00 PM ET).</p>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}