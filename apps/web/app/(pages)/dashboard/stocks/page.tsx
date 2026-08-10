"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useLivePrices } from "@/lib/hooks/useLivePrices";
import DashboardNavbar from "@/components/custom/dashboard/Navbar";
import { FiTrendingUp, FiTrendingDown, FiSearch } from "react-icons/fi";
import { FaHeart, FaRegHeart } from "react-icons/fa";
import { PiPlusCircle } from "react-icons/pi";
import { useRouter } from "next/navigation";
import Link from "next/link";

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

type SortKey = "symbol" | "price" | "change" | "changePct" | "high" | "low";
type SortDir = "asc" | "desc";

type Holding = {
    symbol: string;
    qty: number;
    avgCost: number;
    totalCost: number;
};

function formatCurrency(n: number) {
    return n.toLocaleString(undefined, { style: "currency", currency: "USD" });
}

function resolvePrice(
    sym: string,
    q: QuoteData,
    ticks: Record<string, number>,
    livePrices: Record<string, { close: number }>,
    marketOpen: boolean
) {
    const livePrice = marketOpen
        ? (ticks[sym] ?? livePrices[sym]?.close ?? q.price)
        : q.price;
    const change = marketOpen ? livePrice - q.previousClose : q.change;
    const changePct = q.previousClose ? (change / q.previousClose) * 100 : q.changePct;
    return { price: livePrice, change, changePct };
}

// ─── Sidebar: Holdings ─────────────────────────────────────────────────────────
function StocksPageSkeleton() {
    return (
        <div className="min-h-screen text-white">
            <DashboardNavbar />
            <div className="px-4 py-6 md:px-8 lg:px-16">
                <div className="max-w-7xl mx-auto">
                    <div className="mb-6">
                        <div className="h-6 w-24 bg-white/10 rounded animate-pulse mb-2" />
                        <div className="h-3 w-32 bg-white/10 rounded animate-pulse" />
                    </div>
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        <div className="lg:col-span-2 flex flex-col gap-3">
                            <div className="h-11 w-full bg-white/5 border border-white/10 rounded-xl animate-pulse" />
                            <div className="bg-white/5 border border-white/20 rounded-2xl overflow-hidden">
                                <div className="grid grid-cols-12 px-4 py-3 border-b border-white/10 gap-2">
                                    {[4, 2, 2, 2, 1, 1].map((span, i) => (
                                        <div key={i} className={`col-span-${span} h-3 bg-white/10 rounded animate-pulse`} />
                                    ))}
                                </div>
                                {[...Array(8)].map((_, i) => (
                                    <div key={i} className="grid grid-cols-12 items-center px-4 py-3.5 border-b border-white/5">
                                        <div className="col-span-4 flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-lg bg-white/10 animate-pulse shrink-0" />
                                            <div>
                                                <div className="h-3 w-12 bg-white/10 rounded animate-pulse mb-1.5" />
                                                <div className="h-2 w-20 bg-white/10 rounded animate-pulse" />
                                            </div>
                                        </div>
                                        <div className="col-span-2 flex justify-end">
                                            <div className="h-3 w-16 bg-white/10 rounded animate-pulse" />
                                        </div>
                                        <div className="col-span-2 flex justify-end">
                                            <div className="h-3 w-12 bg-white/10 rounded animate-pulse" />
                                        </div>
                                        <div className="col-span-2 flex justify-end">
                                            <div className="h-5 w-14 bg-white/10 rounded-full animate-pulse" />
                                        </div>
                                        <div className="col-span-1 flex justify-end">
                                            <div className="h-3 w-10 bg-white/10 rounded animate-pulse" />
                                        </div>
                                        <div className="col-span-1 flex justify-end">
                                            <div className="w-5 h-5 bg-white/10 rounded animate-pulse" />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                        <div className="flex flex-col gap-4">
                            <div className="bg-white/5 border border-white/20 rounded-2xl overflow-hidden animate-pulse">
                                <div className="px-5 py-4 border-b border-white/10">
                                    <div className="h-3 w-24 bg-white/10 rounded" />
                                </div>
                                <div className="py-10 flex flex-col items-center gap-2">
                                    <div className="h-3 w-28 bg-white/10 rounded" />
                                    <div className="h-2 w-36 bg-white/10 rounded" />
                                </div>
                                <div className="px-5 py-3 border-t border-white/10 flex flex-col gap-2">
                                    {[...Array(3)].map((_, i) => (
                                        <div key={i} className="flex justify-between">
                                            <div className="h-2 w-16 bg-white/10 rounded" />
                                            <div className="h-2 w-12 bg-white/10 rounded" />
                                        </div>
                                    ))}
                                </div>
                            </div>
                            <div className="bg-white/5 border border-white/20 rounded-2xl overflow-hidden animate-pulse">
                                <div className="px-5 py-4 border-b border-white/10">
                                    <div className="h-3 w-20 bg-white/10 rounded" />
                                </div>
                                <div className="divide-y divide-white/5">
                                    {[...Array(3)].map((_, i) => (
                                        <div key={i} className="flex justify-between px-5 py-3">
                                            <div>
                                                <div className="h-3 w-12 bg-white/10 rounded mb-1.5" />
                                                <div className="h-2 w-20 bg-white/10 rounded" />
                                            </div>
                                            <div className="text-right">
                                                <div className="h-3 w-16 bg-white/10 rounded mb-1.5" />
                                                <div className="h-2 w-10 bg-white/10 rounded ml-auto" />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

function HoldingsSidebar({
    holdings,
    quotes,
    ticks,
    livePrices,
    marketOpen,
}: {
    holdings: Record<string, Holding>;
    quotes: Record<string, QuoteData>;
    ticks: Record<string, number>;
    livePrices: Record<string, { close: number }>;
    marketOpen: boolean;
}) {
    const entries = Object.values(holdings);
    const invested = entries.reduce((sum, h) => sum + h.avgCost * h.qty, 0);
    const currentValue = entries.reduce((sum, h) => {
        const q = quotes[h.symbol];
        const livePrice = marketOpen
            ? (ticks[h.symbol] ?? livePrices[h.symbol]?.close ?? q?.price ?? h.avgCost)
            : (q?.price ?? h.avgCost);
        return sum + livePrice * h.qty;
    }, 0);
    const totalPnl = currentValue - invested;
    const up = totalPnl >= 0;

    return (
        <div className="bg-white/5 border border-white/20 backdrop-blur-xl rounded-2xl overflow-hidden">
            <div className="px-5 py-4 border-b border-white/10">
                <h3 className="text-sm font-bold text-white/70">Your Holdings</h3>
            </div>

            {entries.length === 0 ? (
                <div className="flex flex-col items-center justify-center gap-2 py-10 px-5 text-center">
                    <p className="text-white/30 text-xs">No positions yet.</p>
                    <p className="text-white/20 text-xs">Buy a stock to see it here.</p>
                </div>
            ) : (
                <div className="divide-y divide-white/5">
                    {entries.map((h) => {
                        const q = quotes[h.symbol];
                        const livePrice = marketOpen
                            ? (ticks[h.symbol] ?? livePrices[h.symbol]?.close ?? q?.price ?? h.avgCost)
                            : (q?.price ?? h.avgCost);
                        const currentVal = livePrice * h.qty;
                        const pnl = currentVal - h.avgCost * h.qty;
                        const pnlUp = pnl >= 0;
                        return (
                            <div key={h.symbol} className="px-5 py-3 hover:bg-white/5 transition-colors cursor-pointer">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm font-semibold text-white">{h.symbol}</p>
                                        <p className="text-xs text-white/40">{h.qty} shares @ {formatCurrency(h.avgCost)}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-sm font-semibold text-white tabular-nums">{formatCurrency(currentVal)}</p>
                                        <p className={`text-xs font-medium ${pnlUp ? "text-green-400" : "text-red-400"}`}>
                                            {pnlUp ? "+" : ""}{formatCurrency(pnl)}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            <div className="px-5 py-3 border-t border-white/10">
                <div className="grid grid-cols-3 text-xs text-center divide-x divide-white/10">
                    <div className="px-2">
                        <p className="text-white/40 mb-1">Invested</p>
                        <p className="text-white font-semibold">{formatCurrency(invested)}</p>
                    </div>
                    <div className="px-2">
                        <p className="text-white/40 mb-1">Total P&L</p>
                        <p className={`font-semibold ${up ? "text-green-400" : "text-red-400"}`}>
                            {up ? "+" : ""}{formatCurrency(totalPnl)}
                        </p>
                    </div>
                    <div className="px-2">
                        <p className="text-white/40 mb-1">Positions</p>
                        <p className="text-white font-semibold">{entries.length}</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
// ─── Sidebar: Watchlist ────────────────────────────────────────────────────────

function WatchlistSidebar({
    watchlist,
    quotes,
    ticks,
    livePrices,
    marketOpen,
    onRemove,
}: {
    watchlist: Set<string>;
    quotes: Record<string, QuoteData>;
    ticks: Record<string, number>;
    livePrices: Record<string, { close: number }>;
    marketOpen: boolean;
    onRemove: (sym: string) => void;
}) {
    const router = useRouter();
    const symbols = Array.from(watchlist);

    return (
        <div className="bg-white/5 border border-white/20 backdrop-blur-xl rounded-2xl overflow-hidden">
            <div className="px-5 py-4 border-b border-white/10">
                <h3 className="text-sm font-bold text-white/70">Watchlist</h3>
            </div>

            {symbols.length === 0 ? (
                <div className="flex flex-col items-center justify-center gap-2 py-10 px-5 text-center">
                    <p className="text-white/30 text-xs">No stocks watched yet.</p>
                    <p className="text-white/20 text-xs">Hit the ♡ on any row to add.</p>
                </div>
            ) : (
                <div className="divide-y divide-white/5">
                    {symbols.map(sym => {
                        const q = quotes[sym];
                        if (!q) return (
                            <div key={sym} className="px-5 py-3 text-xs text-white/30">
                                {sym}
                            </div>
                        );

                        const { price, change, changePct } = resolvePrice(sym, q, ticks, livePrices, marketOpen);
                        const up = change >= 0;

                        return (
                            <div
                                key={sym}
                                onClick={() => router.push(`/dashboard/stocks/${sym}`)}
                                className="flex items-center justify-between px-5 py-3 hover:bg-white/5 transition-colors cursor-pointer"
                            >
                                <div>
                                    <p className="text-sm font-semibold text-white">{sym}</p>
                                    <p className="text-xs text-white/40">{q.name}</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-sm font-semibold text-white tabular-nums">
                                        {formatCurrency(price)}
                                    </p>
                                    <p className={`text-xs font-medium ${up ? "text-green-400" : "text-red-400"}`}>
                                        {up ? "+" : ""}{changePct.toFixed(2)}%
                                    </p>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}

// ─── Page ──────────────────────────────────────────────────────────────────────

export default function StocksPage() {
    const supabase = createClient();
    const router = useRouter();
    const { prices: livePrices, ticks, connected } = useLivePrices();

    const [pageLoading, setPageLoading] = useState(true);
    const [quotes, setQuotes] = useState<Record<string, QuoteData>>({});
    const [watchlist, setWatchlist] = useState<Set<string>>(new Set());
    const [search, setSearch] = useState("");
    const [sortKey, setSortKey] = useState<SortKey>("changePct");
    const [sortDir, setSortDir] = useState<SortDir>("desc");
    const [quotesLoading, setQuotesLoading] = useState(true);
    const [userId, setUserId] = useState<string | null>(null);
    const [holdings, setHoldings] = useState<Record<string, Holding>>({});

    const [marketOpen] = useState(() => {
        const now = new Date();
        const et = new Intl.DateTimeFormat("en-US", {
            timeZone: "America/New_York",
            hour: "2-digit", minute: "2-digit", hour12: false, weekday: "short",
        }).formatToParts(now);
        const get = (t: string) => et.find(p => p.type === t)?.value || "";
        const weekday = get("weekday");
        const mins = Number(get("hour")) * 60 + Number(get("minute"));
        return weekday !== "Sat" && weekday !== "Sun" && mins >= 570 && mins < 960;
    });

    useEffect(() => {
        const init = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;
            setUserId(user.id);

            const { data } = await supabase
                .from("watchlist")
                .select("symbol")
                .eq("user_id", user.id);

            if (data) setWatchlist(new Set(data.map(r => r.symbol)));
            const { data: trades } = await supabase
                .from("trades")
                .select("symbol, quantity, price, type")
                .eq("profile_id", user.id);

            if (trades) {
                const map: Record<string, Holding> = {};
                for (const trade of trades) {
                    const qty = trade.type === "sell" ? -trade.quantity : trade.quantity;
                    if (!map[trade.symbol]) {
                        map[trade.symbol] = { symbol: trade.symbol, qty: 0, avgCost: 0, totalCost: 0 };
                    }
                    const h = map[trade.symbol];
                    if (trade.type === "buy") {
                        h.totalCost += trade.price * trade.quantity;
                        h.qty += trade.quantity;
                        h.avgCost = h.totalCost / h.qty;
                    } else {
                        h.qty += qty;
                    }
                }
                for (const sym of Object.keys(map)) {
                    if (map[sym].qty <= 0) delete map[sym];
                }
                setHoldings(map);
            }
            setPageLoading(false);
        };
        init();
    }, []);

    useEffect(() => {
        const fetchQuotes = async () => {
            try {
                const res = await fetch(`${process.env.NEXT_PUBLIC_SERVER_URL}/quotes`);
                if (!res.ok) throw new Error(`HTTP ${res.status}`);
                const data: Record<string, QuoteData> = await res.json();
                setQuotes(data);
            } catch (err) {
                console.error("[quotes] Failed:", err);
            } finally {
                setQuotesLoading(false);
            }
        };
        fetchQuotes();
        const interval = setInterval(fetchQuotes, 5 * 60 * 1000);
        return () => clearInterval(interval);
    }, []);

    const toggleWatchlist = async (e: React.MouseEvent, sym: string) => {
        e.stopPropagation();
        if (!userId) return;

        const isWatched = watchlist.has(sym);
        setWatchlist(prev => {
            const next = new Set(prev);
            isWatched ? next.delete(sym) : next.add(sym);
            return next;
        });

        if (isWatched) {
            await supabase.from("watchlist").delete()
                .eq("user_id", userId).eq("symbol", sym);
        } else {
            await supabase.from("watchlist").insert({ user_id: userId, symbol: sym });
        }
    };

    const handleSort = (key: SortKey) => {
        if (sortKey === key) {
            setSortDir(d => d === "asc" ? "desc" : "asc");
        } else {
            setSortKey(key);
            setSortDir("desc");
        }
    };

    const SortIcon = ({ k }: { k: SortKey }) => {
        if (sortKey !== k) return <span className="text-white/20 ml-1">↕</span>;
        return <span className="text-purple-400 ml-1">{sortDir === "asc" ? "↑" : "↓"}</span>;
    };

    const symbols = Object.keys(quotes);

    const filtered = symbols
        .filter(sym => {
            const q = quotes[sym];
            const s = search.toLowerCase();
            return sym.toLowerCase().includes(s) || q.name.toLowerCase().includes(s);
        })
        .sort((a, b) => {
            const qa = quotes[a];
            const qb = quotes[b];
            const ra = resolvePrice(a, qa, ticks, livePrices, marketOpen);
            const rb = resolvePrice(b, qb, ticks, livePrices, marketOpen);

            const valA = sortKey === "symbol" ? a
                : sortKey === "price" ? ra.price
                    : sortKey === "change" ? ra.change
                        : sortKey === "changePct" ? ra.changePct
                            : sortKey === "high" ? qa.high
                                : qa.low;

            const valB = sortKey === "symbol" ? b
                : sortKey === "price" ? rb.price
                    : sortKey === "change" ? rb.change
                        : sortKey === "changePct" ? rb.changePct
                            : sortKey === "high" ? qb.high
                                : qb.low;

            if (typeof valA === "string") {
                return sortDir === "asc"
                    ? valA.localeCompare(valB as string)
                    : (valB as string).localeCompare(valA);
            }
            return sortDir === "asc"
                ? (valA as number) - (valB as number)
                : (valB as number) - (valA as number);
        });

    if (pageLoading || quotesLoading) return <StocksPageSkeleton />;

    return (
        <div className="min-h-screen text-white">
            <DashboardNavbar />

            <div className="px-4 py-6 md:px-8 lg:px-16">
                <div className="max-w-7xl mx-auto">

                    {/* Header */}
                    <div className="flex items-center justify-between mb-6">
                        <div>
                            <h1 className="text-2xl font-extrabold">Markets</h1>
                            <p className="text-white/40 text-sm mt-0.5">{symbols.length} stocks tracked</p>
                        </div>
                        <div className="flex items-center gap-1.5 text-xs">
                            <span className={`w-1.5 h-1.5 rounded-full ${connected ? "bg-green-400 animate-pulse" : "bg-white/30"}`} />
                            <span className={connected ? "text-green-400" : "text-white/30"}>
                                {connected ? "Live prices" : "Connecting..."}
                            </span>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                        {/* ── Left: stock list ── */}
                        <div className="lg:col-span-2 flex flex-col gap-3">

                            {/* Search */}
                            <div className="relative">
                                <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30" size={16} />
                                <input
                                    type="text"
                                    placeholder="Search by symbol or name..."
                                    value={search}
                                    onChange={e => setSearch(e.target.value)}
                                    className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-3 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-purple-500 transition-colors"
                                />
                            </div>

                            {/* Sort bar */}
                            <div className="bg-white/5 border border-white/20 backdrop-blur-xl rounded-2xl overflow-hidden">
                                <div className="grid grid-cols-12 px-4 py-3 border-b border-white/10 text-xs text-white/30 font-medium">
                                    <div className="col-span-4 cursor-pointer hover:text-white/60 transition-colors select-none" onClick={() => handleSort("symbol")}>
                                        Symbol <SortIcon k="symbol" />
                                    </div>
                                    <div className="col-span-2 text-right cursor-pointer hover:text-white/60 transition-colors select-none" onClick={() => handleSort("price")}>
                                        Price <SortIcon k="price" />
                                    </div>
                                    <div className="col-span-2 text-right cursor-pointer hover:text-white/60 transition-colors select-none" onClick={() => handleSort("change")}>
                                        Change <SortIcon k="change" />
                                    </div>
                                    <div className="col-span-2 text-right cursor-pointer hover:text-white/60 transition-colors select-none" onClick={() => handleSort("changePct")}>
                                        Change% <SortIcon k="changePct" />
                                    </div>
                                    <div className="col-span-1 text-right cursor-pointer hover:text-white/60 transition-colors select-none" onClick={() => handleSort("high")}>
                                        High <SortIcon k="high" />
                                    </div>
                                    <div className="col-span-1" />
                                </div>

                                {/* Rows */}
                                <div className="divide-y divide-white/5">
                                    {quotesLoading && (
                                        <div className="text-center py-20 text-white/30 text-sm">
                                            Loading market data...
                                        </div>
                                    )}

                                    {!quotesLoading && filtered.length === 0 && (
                                        <div className="text-center py-20 text-white/30 text-sm">
                                            No stocks match your search.
                                        </div>
                                    )}

                                    {filtered.map(sym => {
                                        const q = quotes[sym];
                                        const { price, change, changePct } = resolvePrice(sym, q, ticks, livePrices, marketOpen);
                                        const up = change >= 0;
                                        const watched = watchlist.has(sym);

                                        return (
                                            <div
                                                key={sym}
                                                onClick={() => router.push(`/dashboard/stocks/${sym}`)}
                                                className="grid grid-cols-12 items-center px-4 py-3.5 hover:bg-white/5 cursor-pointer transition-colors"
                                            >
                                                {/* Symbol + name */}
                                                <div className="col-span-4 flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center text-xs font-bold text-white/80 shrink-0">
                                                        {sym.slice(0, 2)}
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-bold text-white">{sym}</p>
                                                        <p className="text-xs text-white/40">{q.name}</p>
                                                    </div>
                                                </div>

                                                {/* Price */}
                                                <div className="col-span-2 text-right">
                                                    <p className="text-sm font-semibold text-white tabular-nums">
                                                        {formatCurrency(price)}
                                                    </p>
                                                </div>

                                                {/* Change */}
                                                <div className="col-span-2 text-right">
                                                    <p className={`text-sm font-medium tabular-nums ${up ? "text-green-400" : "text-red-400"}`}>
                                                        {up ? "+" : ""}{change.toFixed(2)}
                                                    </p>
                                                </div>

                                                {/* Change% */}
                                                <div className="col-span-2 text-right">
                                                    <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-full ${up ? "bg-green-400/10 text-green-400" : "bg-red-400/10 text-red-400"}`}>
                                                        {up ? <FiTrendingUp size={10} /> : <FiTrendingDown size={10} />}
                                                        {up ? "+" : ""}{changePct.toFixed(2)}%
                                                    </span>
                                                </div>

                                                {/* High */}
                                                <div className="col-span-1 text-right">
                                                    <p className="text-xs text-white/40 tabular-nums">{formatCurrency(q.high)}</p>
                                                </div>

                                                {/* Watchlist */}
                                                <div className="col-span-1 flex justify-end">
                                                    <button
                                                        onClick={e => toggleWatchlist(e, sym)}
                                                        className="p-2 rounded-lg hover:bg-white/10 transition-colors"
                                                    >
                                                        {watched
                                                            ? <FaHeart size={13} className="text-red-400" />
                                                            : <FaRegHeart size={13} className="text-white/30 hover:text-red-400 transition-colors" />
                                                        }
                                                    </button>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>

                        {/* ── Right: sidebar ── */}
                        <div className="flex flex-col gap-4">
                            <HoldingsSidebar
                                holdings={holdings}
                                quotes={quotes}
                                ticks={ticks}
                                livePrices={livePrices}
                                marketOpen={marketOpen}
                            />
                            <WatchlistSidebar
                                watchlist={watchlist}
                                quotes={quotes}
                                ticks={ticks}
                                livePrices={livePrices}
                                marketOpen={marketOpen}
                                onRemove={(sym) => {
                                    setWatchlist(prev => {
                                        const next = new Set(prev);
                                        next.delete(sym);
                                        return next;
                                    });
                                }}
                            />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}