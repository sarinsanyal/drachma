"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Toaster } from "sonner";
import { FiTrendingUp, FiTrendingDown, FiRss, FiExternalLink, FiClock } from "react-icons/fi";
import { PiPlusCircle } from "react-icons/pi";
import Link from "next/link";
import { useLivePrices } from "@/lib/hooks/useLivePrices";
import DashboardNavbar from "@/components/custom/dashboard/Navbar";

// ─── Types ─────────────────────────────────────────────────────────────────────

type Candle = {
    symbol: string;
    open: number;
    high: number;
    low: number;
    close: number;
    volume: number;
    bucketStart: number;
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

type Profile = {
    id: string;
    balance: number;
};

type Holding = {
    symbol: string;
    qty: number;
    avgCost: number;
    totalCost: number;
};

// ─── Helpers ───────────────────────────────────────────────────────────────────

function formatCurrency(n: number) {
    return n.toLocaleString(undefined, { style: "currency", currency: "USD" });
}

function getETOffsetHours(date: Date): number {
    const fmt = new Intl.DateTimeFormat("en-US", {
        timeZone: "America/New_York",
        timeZoneName: "shortOffset",
    });
    const part = fmt.formatToParts(date).find((p) => p.type === "timeZoneName")?.value || "GMT-5";
    const match = part.match(/GMT([+-]\d+)/);
    return match ? parseInt(match[1], 10) : -5;
}

function getMarketStatus() {
    const now = new Date();
    const offsetHours = getETOffsetHours(now);

    const etParts = new Intl.DateTimeFormat("en-US", {
        timeZone: "America/New_York",
        year: "numeric", month: "2-digit", day: "2-digit",
        hour: "2-digit", minute: "2-digit",
        hour12: false, weekday: "short",
    }).formatToParts(now);

    const get = (type: string) => etParts.find((p) => p.type === type)?.value || "";
    const weekday = get("weekday");
    const hour = Number(get("hour"));
    const minute = Number(get("minute"));
    const year = Number(get("year"));
    const month = Number(get("month"));
    const day = Number(get("day"));

    const isWeekday = weekday !== "Sat" && weekday !== "Sun";
    const minutesNow = hour * 60 + minute;
    const isOpen = isWeekday && minutesNow >= 9 * 60 + 30 && minutesNow < 16 * 60;

    const openUTC = new Date(Date.UTC(year, month - 1, day, 9 - offsetHours, 30));
    const closeUTC = new Date(Date.UTC(year, month - 1, day, 16 - offsetHours, 0));

    return { isOpen, openUTC, closeUTC, isWeekday };
}

function formatLocalTime(date: Date) {
    return date.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
}

function formatCountdown(targetUTC: Date): string {
    const diff = targetUTC.getTime() - Date.now();
    if (diff <= 0) return "now";
    const totalSeconds = Math.floor(diff / 1000);
    const h = Math.floor(totalSeconds / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);
    const s = totalSeconds % 60;
    if (h > 0) return `${h}h ${m}m`;
    if (m > 0) return `${m}m ${s}s`;
    return `${s}s`;
}

function resolvePrice(
    sym: string,
    q: QuoteData,
    ticks: Record<string, number>,
    livePrices: Record<string, Candle>,
    marketOpen: boolean
): { price: number; change: number; changePct: number } {
    const livePrice = marketOpen
        ? (ticks[sym] ?? livePrices[sym]?.close ?? q.price)
        : q.price;
    const change = marketOpen ? livePrice - q.previousClose : q.change;
    const changePct = q.previousClose ? (change / q.previousClose) * 100 : q.changePct;
    return { price: livePrice, change, changePct };
}

// ─── Ticker Carousel ───────────────────────────────────────────────────────────

function TickerCarousel({
    quotes, livePrices, ticks, marketOpen,
}: {
    quotes: Record<string, QuoteData>;
    livePrices: Record<string, Candle>;
    ticks: Record<string, number>;
    marketOpen: boolean;
}) {
    const symbols = Object.keys(quotes);
    if (symbols.length === 0) return null;

    const items = [...symbols, ...symbols].map((sym, i) => {
        const q = quotes[sym];
        const { price, change, changePct } = resolvePrice(sym, q, ticks, livePrices, marketOpen);
        const up = change >= 0;

        return (
            <div key={`${sym}-${i}`} className="flex items-center gap-3 px-2 select-none">
                <span className="text-xs font-bold text-white tracking-wide">{sym}</span>
                <span className="text-xs text-white/50">{q.name}</span>
                <span className="text-xs font-semibold text-white">{formatCurrency(price)}</span>
                <span className={`flex items-center gap-0.5 text-xs font-semibold ${up ? "text-green-400" : "text-red-400"}`}>
                    {up ? <FiTrendingUp size={11} /> : <FiTrendingDown size={11} />}
                    {up ? "+" : ""}{change.toFixed(2)} ({up ? "+" : ""}{changePct.toFixed(2)}%)
                </span>
                <span className="text-white/20 text-xs">·</span>
            </div>
        );
    });

    return (
        <div className="relative w-full overflow-hidden border-y border-white/10 bg-white/3 py-2.5">
            <div className="pointer-events-none absolute left-0 top-0 h-full w-16 z-10 bg-linear-to-r from-black/80 to-transparent" />
            <div className="pointer-events-none absolute right-0 top-0 h-full w-16 z-10 bg-linear-to-l from-black/80 to-transparent" />
            <div
                className="flex gap-8 w-max"
                style={{ animation: "ticker-scroll 100s linear infinite" }}
                onMouseEnter={e => (e.currentTarget.style.animationPlayState = "paused")}
                onMouseLeave={e => (e.currentTarget.style.animationPlayState = "running")}
            >
                {items}
            </div>
            <style jsx>{`
                @keyframes ticker-scroll {
                    0%   { transform: translateX(0); }
                    100% { transform: translateX(-50%); }
                }
            `}</style>
        </div>
    );
}

// ─── Top Movers ────────────────────────────────────────────────────────────────

function TopMovers({
    quotes, livePrices, ticks, marketOpen,
}: {
    quotes: Record<string, QuoteData>;
    livePrices: Record<string, Candle>;
    ticks: Record<string, number>;
    marketOpen: boolean;
}) {
    const symbols = Object.keys(quotes).slice(0, 5);

    return (
        <div className="bg-white/5 border border-white/20 backdrop-blur-xl rounded-2xl overflow-hidden">
            <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between">
                <h2 className="text-sm font-bold text-white/70">Top Movers</h2>
                <Link href="/dashboard/stocks" className="text-xs text-purple-400 hover:text-purple-300 transition-colors">
                    View all →
                </Link>
            </div>
            <div className="divide-y divide-white/5">
                {symbols.length === 0 && (
                    <p className="text-xs text-white/30 px-6 py-4">Loading quotes...</p>
                )}
                {symbols.map((sym) => {
                    const q = quotes[sym];
                    const { price, change, changePct } = resolvePrice(sym, q, ticks, livePrices, marketOpen);
                    const up = change >= 0;

                    return (
                        <div key={sym} className="flex items-center justify-between px-6 py-3 hover:bg-white/5 transition-colors cursor-pointer">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center text-xs font-bold text-white/80">
                                    {sym.slice(0, 2)}
                                </div>
                                <div>
                                    <p className="text-sm font-semibold text-white">{sym}</p>
                                    <p className="text-xs text-white/40">{q.name}</p>
                                </div>
                            </div>
                            <div className="text-right">
                                <p className="text-sm font-semibold text-white">{formatCurrency(price)}</p>
                                <p className={`text-xs font-medium ${up ? "text-green-400" : "text-red-400"}`}>
                                    {up ? "+" : ""}{changePct.toFixed(2)}%
                                </p>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

// ─── Watchlist ─────────────────────────────────────────────────────────────────

function Watchlist({
    quotes, livePrices, ticks, marketOpen,
}: {
    quotes: Record<string, QuoteData>;
    livePrices: Record<string, Candle>;
    ticks: Record<string, number>;
    marketOpen: boolean;
}) {
    const supabase = createClient();
    const [watchlist, setWatchlist] = useState<string[]>([]);
    const [wlLoading, setWlLoading] = useState(true);

    useEffect(() => {
        const fetch = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) { setWlLoading(false); return; }

            const { data } = await supabase
                .from("watchlist")
                .select("symbol")
                .eq("user_id", user.id);

            if (data) setWatchlist(data.map(r => r.symbol));
            setWlLoading(false);
        };
        fetch();
    }, []);

    return (
        <div className="bg-white/5 border border-white/20 backdrop-blur-xl rounded-2xl overflow-hidden">
            <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between">
                <h2 className="text-sm font-bold text-white/70">Watchlist</h2>
                <Link href="/dashboard/stocks" className="text-xs text-purple-400 hover:text-purple-300 transition-colors">
                    Manage →
                </Link>
            </div>
            <div className="divide-y divide-white/5">
                {wlLoading && (
                    <div className="px-6 py-4 flex flex-col gap-3 animate-pulse">
                        {[...Array(3)].map((_, i) => (
                            <div key={i} className="flex justify-between">
                                <div className="h-3 w-16 bg-white/10 rounded" />
                                <div className="h-3 w-12 bg-white/10 rounded" />
                            </div>
                        ))}
                    </div>
                )}
                {!wlLoading && watchlist.length === 0 && (
                    <div className="flex flex-col items-center justify-center gap-2 py-8 px-6 text-center">
                        <p className="text-white/30 text-xs">No stocks watched yet.</p>
                        <Link href="/dashboard/stocks" className="text-xs text-purple-400 hover:text-purple-300 transition-colors">
                            Browse markets →
                        </Link>
                    </div>
                )}
                {!wlLoading && watchlist.map((sym) => {
                    const q = quotes[sym];
                    if (!q) return (
                        <div key={sym} className="px-6 py-3 text-xs text-white/30">{sym}</div>
                    );

                    const { price, change, changePct } = resolvePrice(sym, q, ticks, livePrices, marketOpen);
                    const up = change >= 0;

                    return (
                        <Link key={sym} href={`/dashboard/stocks/${sym}`} className="flex items-center justify-between px-6 py-3 hover:bg-white/5 transition-colors cursor-pointer">
                            <div>
                                <p className="text-sm font-semibold text-white">{sym}</p>
                                <p className="text-xs text-white/40">{q.name}</p>
                            </div>
                            <div className="text-right">
                                <p className="text-sm font-semibold text-white tabular-nums">{formatCurrency(price)}</p>
                                <p className={`text-xs font-medium ${up ? "text-green-400" : "text-red-400"}`}>
                                    {up ? "+" : ""}{changePct.toFixed(2)}%
                                </p>
                            </div>
                        </Link>
                    );
                })}
            </div>
        </div>
    );
}

// ─── Recent Activity ───────────────────────────────────────────────────────────

function RecentActivity() {
    const supabase = createClient();
    const [trades, setTrades] = useState<{
        id: number;
        symbol: string;
        quantity: number;
        price: number;
        type: string;
        created_at: string;
    }[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetch = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) { setLoading(false); return; }

            const { data } = await supabase
                .from("trades")
                .select("id, symbol, quantity, price, type, created_at")
                .eq("profile_id", user.id)
                .order("created_at", { ascending: false })
                .limit(10);

            if (data) setTrades(data);
            setLoading(false);
        };
        fetch();
    }, []);

    return (
        <div className="bg-white/5 border border-white/20 backdrop-blur-xl rounded-2xl overflow-hidden">
            <div className="px-6 py-4 border-b border-white/10">
                <h2 className="text-lg font-bold">Recent Activity</h2>
            </div>

            {loading && (
                <div className="divide-y divide-white/5 animate-pulse">
                    {[...Array(3)].map((_, i) => (
                        <div key={i} className="flex items-center justify-between px-6 py-4">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-lg bg-white/10" />
                                <div>
                                    <div className="h-3 w-16 bg-white/10 rounded mb-2" />
                                    <div className="h-2 w-24 bg-white/10 rounded" />
                                </div>
                            </div>
                            <div className="text-right">
                                <div className="h-3 w-16 bg-white/10 rounded mb-2 ml-auto" />
                                <div className="h-2 w-10 bg-white/10 rounded ml-auto" />
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {!loading && trades.length === 0 && (
                <div className="flex flex-col items-center justify-center gap-2 py-10 px-6 text-center">
                    <p className="text-white/30 text-xs">No trades yet. Your activity will appear here.</p>
                </div>
            )}

            {!loading && trades.length > 0 && (
                <div className="divide-y divide-white/5">
                    {trades.map((t) => {
                        const isBuy = t.type === "buy";
                        const total = t.quantity * t.price;
                        const date = new Date(t.created_at);
                        const label = date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
                        const time = date.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });

                        return (
                            <div key={t.id} className="flex items-center justify-between px-6 py-3 hover:bg-white/5 transition-colors">
                                <div className="flex items-center gap-3">
                                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold ${isBuy ? "bg-green-400/10 text-green-400" : "bg-red-400/10 text-red-400"}`}>
                                        {isBuy ? "B" : "S"}
                                    </div>
                                    <div>
                                        <p className="text-sm font-semibold text-white">
                                            {isBuy ? "Bought" : "Sold"} {t.symbol}
                                        </p>
                                        <p className="text-xs text-white/40">
                                            {t.quantity} shares @ {formatCurrency(t.price)}
                                        </p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className={`text-sm font-semibold ${isBuy ? "text-red-400" : "text-green-400"}`}>
                                        {isBuy ? "-" : "+"}{formatCurrency(total)}
                                    </p>
                                    <p className="text-xs text-white/40">{label} · {time}</p>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}

// ─── Market News (Max 2 Items) ───────────────────────────────────────────────

function MarketNews() {
    const [news, setNews] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchNews() {
            const apiKey = process.env.NEXT_PUBLIC_FINNHUB_API_KEY;
            if (!apiKey) {
                setLoading(false);
                return;
            }
            try {
                const res = await fetch(`https://finnhub.io/api/v1/news?category=general&token=${apiKey}`);
                if (res.ok) {
                    const data = await res.json();
                    setNews(data.slice(0, 2)); // Limits output to MAX 2 news items
                }
            } catch (err) {
                console.error("Failed to fetch news:", err);
            } finally {
                setLoading(false);
            }
        }
        fetchNews();
    }, []);

    return (
        <div className="bg-white/5 border border-white/20 backdrop-blur-xl rounded-2xl overflow-hidden">
            <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <FiRss size={15} className="text-purple-400" />
                    <h2 className="text-sm font-bold text-white/70">Latest News</h2>
                </div>
                <Link href="/dashboard/news" className="text-xs text-purple-400 hover:text-purple-300 transition-colors">
                    View all →
                </Link>
            </div>

            <div className="divide-y divide-white/5">
                {loading && <p className="text-xs text-white/30 px-6 py-4">Loading market news...</p>}
                {!loading && news.length === 0 && <p className="text-xs text-white/30 px-6 py-4">No headlines available.</p>}
                {!loading && news.map((item) => (
                    <a
                        key={item.id}
                        href={item.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block px-6 py-3.5 hover:bg-white/5 transition-colors group"
                    >
                        <div className="flex items-center justify-between text-[11px] text-white/40 mb-1">
                            <span className="font-semibold text-white/60">{item.source}</span>
                            <span className="flex items-center gap-1">
                                <FiClock size={10} />
                                {new Date(item.datetime * 1000).toLocaleDateString()}
                            </span>
                        </div>
                        <h3 className="text-xs font-semibold text-white group-hover:text-purple-300 transition-colors line-clamp-1 mb-0.5">
                            {item.headline}
                        </h3>
                        <p className="text-[11px] text-white/40 line-clamp-2">{item.summary}</p>
                    </a>
                ))}
            </div>
        </div>
    );
}

// ─── Page ──────────────────────────────────────────────────────────────────────

export default function Dashboard() {
    const supabase = createClient();
    const { connected, prices: livePrices, ticks } = useLivePrices();

    const [profile, setProfile] = useState<Profile | null>(null);
    const [quotes, setQuotes] = useState<Record<string, QuoteData>>({});
    const [loading, setLoading] = useState(true);
    const [quotesLoading, setQuotesLoading] = useState(true);
    const [market, setMarket] = useState(getMarketStatus());
    const [countdown, setCountdown] = useState("");

    // 👇 Define your initial starting balance (adjust as needed)
    const INITIAL_BALANCE = 10000;

    useEffect(() => {
        const fetchProfile = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) { setLoading(false); return; }

            const { data, error } = await supabase
                .from("profiles")
                .select("id, balance")
                .eq("id", user.id)
                .single();

            if (error) console.error("Failed to load profile:", error.message);
            else setProfile(data);
            setLoading(false);
        };
        fetchProfile();
    }, []);

    useEffect(() => {
        const fetchQuotes = async () => {
            try {
                const res = await fetch(`${process.env.NEXT_PUBLIC_SERVER_URL}/quotes`);
                if (!res.ok) throw new Error(`HTTP ${res.status}`);
                const data: Record<string, QuoteData> = await res.json();
                setQuotes(data);
            } catch (err) {
                console.error("[quotes] Failed to fetch quotes:", err);
            } finally {
                setQuotesLoading(false);
            }
        };
        fetchQuotes();
        const interval = setInterval(fetchQuotes, 5 * 60 * 1000);
        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        const interval = setInterval(() => setMarket(getMarketStatus()), 60_000);
        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        const tick = () => {
            const target = market.isOpen
                ? market.closeUTC
                : market.isWeekday
                    ? market.openUTC
                    : null;
            setCountdown(target ? formatCountdown(target) : "");
        };
        tick();
        const interval = setInterval(tick, 1_000);
        return () => clearInterval(interval);
    }, [market]);

    const [holdings, setHoldings] = useState<Record<string, Holding>>({});

    useEffect(() => {
        const fetchHoldings = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const { data, error } = await supabase
                .from("trades")
                .select("symbol, quantity, price, type")
                .eq("profile_id", user.id);

            if (error || !data) return;

            const map: Record<string, Holding> = {};
            for (const trade of data) {
                const qty = trade.type === "sell" ? -trade.quantity : trade.quantity;
                if (!map[trade.symbol]) {
                    map[trade.symbol] = { symbol: trade.symbol, qty: 0, avgCost: 0, totalCost: 0 };
                }
                const h = map[trade.symbol];
                if (trade.type === "buy") {
                    h.totalCost += trade.price * trade.quantity;
                    h.qty += qty;
                    h.avgCost = h.totalCost / h.qty;
                } else {
                    h.totalCost -= h.avgCost * trade.quantity;
                    h.qty += qty;
                }
            }

            for (const sym of Object.keys(map)) {
                if (map[sym].qty <= 0) delete map[sym];
            }

            setHoldings(map);
        };
        fetchHoldings();
    }, []);

    const cashBalance = profile?.balance ?? 0;

    const invested = Object.values(holdings).reduce((sum, h) => sum + h.avgCost * h.qty, 0);

    const currentValue = Object.values(holdings).reduce((sum, h) => {
        const q = quotes[h.symbol];
        const livePrice = market.isOpen
            ? (ticks[h.symbol] ?? livePrices[h.symbol]?.close ?? q?.price ?? h.avgCost)
            : (q?.price ?? h.avgCost);
        return sum + livePrice * h.qty;
    }, 0);

    // ─── All‑time P&L (based on initial balance) ──────────────────────────────
    const portfolioValue = cashBalance + currentValue;
    const totalPnl = portfolioValue - INITIAL_BALANCE;
    const totalPnlPct = INITIAL_BALANCE > 0 ? (totalPnl / INITIAL_BALANCE) * 100 : 0;

    // skeleton
    if (loading) {
        return (
            <div className="min-h-screen text-white">
                <DashboardNavbar />
                <div className="px-4 py-6 md:px-8 lg:px-16">
                    <div className="max-w-6xl mx-auto mt-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
                        <div className="lg:col-span-2 flex flex-col gap-6">
                            <div className="bg-white/5 border border-white/10 rounded-2xl p-8 animate-pulse">
                                <div className="h-3 w-24 bg-white/10 rounded mb-4" />
                                <div className="h-10 w-48 bg-white/10 rounded mb-3" />
                                <div className="h-3 w-32 bg-white/10 rounded" />
                            </div>
                            <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden animate-pulse">
                                <div className="px-6 py-4 border-b border-white/10">
                                    <div className="h-3 w-24 bg-white/10 rounded" />
                                </div>
                                {[...Array(5)].map((_, i) => (
                                    <div key={i} className="flex items-center justify-between px-6 py-4 border-b border-white/5">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-lg bg-white/10" />
                                            <div>
                                                <div className="h-3 w-12 bg-white/10 rounded mb-2" />
                                                <div className="h-2 w-20 bg-white/10 rounded" />
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <div className="h-3 w-16 bg-white/10 rounded mb-2" />
                                            <div className="h-2 w-10 bg-white/10 rounded" />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                        <div className="flex flex-col gap-4">
                            <div className="bg-white/5 border border-white/10 rounded-2xl p-5 animate-pulse">
                                <div className="h-3 w-20 bg-white/10 rounded mb-4" />
                                <div className="h-3 w-32 bg-white/10 rounded mb-2" />
                                <div className="h-3 w-24 bg-white/10 rounded" />
                            </div>
                            <div className="bg-white/5 border border-white/10 rounded-2xl p-5 animate-pulse flex flex-col gap-4">
                                {[...Array(4)].map((_, i) => (
                                    <div key={i}>
                                        <div className="h-2 w-16 bg-white/10 rounded mb-2" />
                                        <div className="h-5 w-24 bg-white/10 rounded" />
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    if (!profile) {
        return (
            <div className="min-h-screen text-white flex items-center justify-center">
                <p className="text-white/40 text-sm">Could not load profile.</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen text-white">
            <DashboardNavbar />
            <Toaster />

            {!quotesLoading && (
                <TickerCarousel
                    quotes={quotes}
                    livePrices={livePrices}
                    ticks={ticks}
                    marketOpen={market.isOpen}
                />
            )}

            <div className="px-4 py-6 md:px-8 lg:px-16">
                <div className="max-w-6xl mx-auto mt-6 grid grid-cols-1 lg:grid-cols-3 gap-6">

                    {/* Main column */}
                    <div className="lg:col-span-2 flex flex-col gap-6">

                        <div className="bg-white/5 border border-white/20 backdrop-blur-xl rounded-2xl p-8">
                            <p className="text-white/50 text-sm mb-1">Your portfolio</p>
                            <h1 className="text-4xl lg:text-5xl font-extrabold mb-2">{formatCurrency(portfolioValue)}</h1>
                            <div className={`flex items-center gap-2 text-sm mb-6 ${totalPnl >= 0 ? "text-green-400" : "text-red-400"}`}>
                                {totalPnl >= 0 ? <FiTrendingUp /> : <FiTrendingDown />}
                                <span>{totalPnl >= 0 ? "+" : ""}{formatCurrency(totalPnl)} ({totalPnl >= 0 ? "+" : ""}{totalPnlPct.toFixed(2)}%) all time</span>
                            </div>
                            <div className="flex items-center gap-4 pt-4 border-t border-white/10">
                                <div>
                                    <p className="text-white/40 text-xs mb-1">Cash</p>
                                    <p className="text-base font-semibold">{formatCurrency(cashBalance)}</p>
                                </div>
                                <div className="w-px h-8 bg-white/10" />
                                <div>
                                    <p className="text-white/40 text-xs mb-1">Invested</p>
                                    <p className="text-base font-semibold">{formatCurrency(invested)}</p>
                                </div>
                                <div className="w-px h-8 bg-white/10" />
                                <div>
                                    <p className="text-white/40 text-xs mb-1">P&L</p>
                                    <p className={`text-base font-semibold ${totalPnl >= 0 ? "text-green-400" : "text-red-400"}`}>
                                        {totalPnl >= 0 ? "+" : ""}{formatCurrency(totalPnl)}
                                    </p>
                                </div>
                            </div>
                        </div>


                        <div className="bg-white/5 border border-white/20 backdrop-blur-xl rounded-2xl overflow-hidden">
                            <div className="px-6 py-4 border-b border-white/10">
                                <h2 className="text-lg font-bold">Holdings</h2>
                            </div>
                            <div className="divide-y divide-white/5">
                                {Object.keys(holdings).length === 0 ? (
                                    <div className="flex flex-col items-center justify-center gap-3 py-16 px-6 text-center">
                                        <p className="text-white/50 text-sm max-w-sm">
                                            You don't own any stocks yet. Browse the market and make your first trade.
                                        </p>
                                        <Link href="/dashboard/stocks" className="flex items-center gap-2 mt-2 bg-purple-700 hover:bg-purple-800 transition-colors text-white font-semibold px-5 py-2.5 rounded-lg">
                                            <PiPlusCircle size={18} />
                                            Browse stocks
                                        </Link>
                                    </div>
                                ) : (
                                    Object.values(holdings).map((h) => {
                                        const q = quotes[h.symbol];
                                        // Replace the livePrice line inside the holdings .map():
                                        const livePrice = quotesLoading
                                            ? null
                                            : market.isOpen
                                                ? (ticks[h.symbol] ?? livePrices[h.symbol]?.close ?? q?.price ?? h.avgCost)
                                                : (q?.price ?? h.avgCost);

                                        if (livePrice === null) return (
                                            <div key={h.symbol} className="flex items-center justify-between px-6 py-3 animate-pulse">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-lg bg-white/10" />
                                                    <div>
                                                        <div className="h-3 w-12 bg-white/10 rounded mb-1.5" />
                                                        <div className="h-2 w-20 bg-white/10 rounded" />
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <div className="h-3 w-16 bg-white/10 rounded mb-1.5" />
                                                    <div className="h-2 w-10 bg-white/10 rounded ml-auto" />
                                                </div>
                                            </div>
                                        );
                                        const currentVal = livePrice * h.qty;
                                        const pnl = currentVal - h.avgCost * h.qty;
                                        const pnlPct = (pnl / (h.avgCost * h.qty)) * 100;
                                        const up = pnl >= 0;
                                        return (
                                            <Link key={h.symbol} href={`/dashboard/stocks/${h.symbol}`} className="flex items-center justify-between px-6 py-3 hover:bg-white/5 transition-colors">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center text-xs font-bold text-white/80">
                                                        {h.symbol.slice(0, 2)}
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-semibold text-white">{h.symbol}</p>
                                                        <p className="text-xs text-white/40">{h.qty} shares @ {formatCurrency(h.avgCost)}</p>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-sm font-semibold text-white tabular-nums">{formatCurrency(currentVal)}</p>
                                                    <p className={`text-xs font-medium ${up ? "text-green-400" : "text-red-400"}`}>
                                                        {up ? "+" : ""}{formatCurrency(pnl)} ({up ? "+" : ""}{pnlPct.toFixed(2)}%)
                                                    </p>
                                                </div>
                                            </Link>
                                        );
                                    })
                                )}
                            </div>
                        </div>
                        <TopMovers
                            quotes={quotes}
                            livePrices={livePrices}
                            ticks={ticks}
                            marketOpen={market.isOpen}
                        />
                        <RecentActivity />
                    </div>

                    {/* Sidebar */}
                    <div className="flex flex-col gap-4">

                        <div className="bg-white/5 border border-white/20 backdrop-blur-xl rounded-2xl p-5">
                            <div className="flex items-center justify-between mb-3">
                                <h3 className="text-sm font-bold text-white/70">US Market</h3>
                                <span className={`flex items-center gap-1.5 text-xs font-semibold ${market.isOpen ? "text-green-400" : "text-red-400"}`}>
                                    <span className={`w-1.5 h-1.5 rounded-full ${market.isOpen ? "bg-green-400 animate-pulse" : "bg-red-400"}`} />
                                    {market.isOpen ? "Open" : "Closed"}
                                </span>
                            </div>

                            {market.isOpen ? (
                                <p className="text-xs text-white/50">
                                    Closes at {formatLocalTime(market.closeUTC)} local time
                                </p>
                            ) : (
                                <p className="text-xs text-white/50">
                                    {market.isWeekday
                                        ? `Opens at ${formatLocalTime(market.openUTC)} local time`
                                        : `Closed for the weekend, opens at ${formatLocalTime(market.openUTC)} local time`}
                                </p>
                            )}

                            {countdown && (
                                <div className="mt-2">
                                    <p className="text-xs text-white/30">
                                        {market.isOpen ? "Closes in" : "Opens in"}{" "}
                                        <span className="text-white/70 font-semibold tabular-nums">{countdown}</span>
                                    </p>
                                </div>
                            )}

                            <div className="mt-3 pt-3 border-t border-white/10 flex items-center gap-1.5 text-xs">
                                <span className={`w-1.5 h-1.5 rounded-full ${connected ? "bg-green-400 animate-pulse" : "bg-white/30"}`} />
                                <span className={connected ? "text-green-400" : "text-white/30"}>
                                    {connected ? "Live prices connected" : "Connecting to price feed..."}
                                </span>
                            </div>
                        </div>

                        <div className="bg-white/5 border border-white/20 backdrop-blur-xl rounded-2xl p-5 flex flex-col gap-4">
                            <div>
                                <p className="text-white/40 text-xs mb-1">Cash balance</p>
                                <p className="text-xl font-bold">{formatCurrency(cashBalance)}</p>
                            </div>
                            <div>
                                <p className="text-white/40 text-xs mb-1">Invested</p>
                                <p className="text-xl font-bold">{formatCurrency(invested)}</p>
                            </div>
                            <div>
                                <p className="text-white/40 text-xs mb-1">Total P&L</p>
                                <p className={`text-xl font-bold ${totalPnl >= 0 ? "text-green-400" : "text-red-400"}`}>{totalPnl >= 0 ? "+" : ""}{formatCurrency(totalPnl)}</p>
                            </div>
                            <div>
                                <p className="text-white/40 text-xs mb-1">Positions</p>
                                <p className="text-xl font-bold">{Object.keys(holdings).length}</p>
                            </div>
                        </div>

                        <Watchlist
                            quotes={quotes}
                            livePrices={livePrices}
                            ticks={ticks}
                            marketOpen={market.isOpen}
                        />

                        <MarketNews />
                    </div>
                </div>
            </div>
        </div>
    );
}