"use client";

import { useEffect, useState, useMemo } from "react";
import DashboardNavbar from "@/components/custom/dashboard/Navbar";
import { FiRss, FiExternalLink, FiClock, FiSearch } from "react-icons/fi";

interface NewsArticle {
    id: number;
    category: string;
    datetime: number;
    headline: string;
    image: string;
    related: string;
    source: string;
    summary: string;
    url: string;
}

const CATEGORIES = ["general", "crypto", "forex", "merger"];
const LIMIT_OPTIONS = [10, 20, 50, 100];

export default function NewsPage() {
    const [news, setNews] = useState<NewsArticle[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    // Filter States
    const [selectedCategory, setSelectedCategory] = useState<string>("general");
    const [searchQuery, setSearchQuery] = useState<string>("");
    const [articleLimit, setArticleLimit] = useState<number>(20);

    useEffect(() => {
        async function fetchNews() {
            setLoading(true);
            setError(null);

            const apiKey = process.env.NEXT_PUBLIC_FINNHUB_API_KEY;
            if (!apiKey) {
                setError("API key is missing.");
                setLoading(false);
                return;
            }

            try {
                const res = await fetch(
                    `https://finnhub.io/api/v1/news?category=${selectedCategory}&token=${apiKey}`
                );
                if (!res.ok) throw new Error("Failed to fetch news");

                const data: NewsArticle[] = await res.json();
                setNews(data);
            } catch (err) {
                setError("Could not load market news at this time.");
            } finally {
                setLoading(false);
            }
        }

        fetchNews();
    }, [selectedCategory]);

    // Client-side filtering & limiting
    const filteredNews = useMemo(() => {
        return news
            .filter((item) => {
                const query = searchQuery.toLowerCase().trim();
                if (!query) return true;
                return (
                    item.headline.toLowerCase().includes(query) ||
                    item.summary.toLowerCase().includes(query) ||
                    item.source.toLowerCase().includes(query) ||
                    item.related.toLowerCase().includes(query)
                );
            })
            .slice(0, articleLimit);
    }, [news, searchQuery, articleLimit]);

    return (
        <div className="min-h-screen text-white ">
            <DashboardNavbar />
            <div className="px-4 py-8 md:px-8 lg:px-16 max-w-7xl mx-auto">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center">
                            <FiRss size={20} className="text-white/70" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold">Market News</h1>
                            <p className="text-white/40 text-sm">
                                Real-time headlines and market insights
                            </p>
                        </div>
                    </div>

                    {/* Category Selector Tabs */}
                    <div className="flex items-center gap-1 bg-white/5 border border-white/10 p-1 rounded-xl self-start md:self-auto">
                        {CATEGORIES.map((cat) => (
                            <button
                                key={cat}
                                onClick={() => setSelectedCategory(cat)}
                                className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-all ${selectedCategory === cat
                                        ? "bg-white text-black font-semibold"
                                        : "text-white/60 hover:text-white hover:bg-white/5"
                                    }`}
                            >
                                {cat}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Search & Limit Control Bar */}
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-8">
                    {/* Keyword Search Input */}
                    <div className="relative w-full sm:w-80">
                        <FiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/40" size={16} />
                        <input
                            type="text"
                            placeholder="Search headline, summary, or ticker..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-2 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-white/30 transition-colors"
                        />
                    </div>

                    {/* Limit Selector */}
                    <div className="flex items-center gap-2 self-end sm:self-auto text-xs text-white/50">
                        <span>Show:</span>
                        <select
                            value={articleLimit}
                            onChange={(e) => setArticleLimit(Number(e.target.value))}
                            className="bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-white/30 transition-colors cursor-pointer"
                        >
                            {LIMIT_OPTIONS.map((option) => (
                                <option key={option} value={option} className="bg-neutral-900 text-white">
                                    {option} articles
                                </option>
                            ))}
                        </select>
                    </div>
                </div>

                {/* Content State Handling */}
                {loading ? (
                    /* Skeleton Loading Grid */
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {[...Array(6)].map((_, i) => (
                            <div
                                key={i}
                                className="border border-white/10 bg-white/5 rounded-2xl overflow-hidden animate-pulse flex flex-col justify-between"
                            >
                                <div>
                                    {/* Image Skeleton */}
                                    <div className="h-48 w-full bg-white/10" />

                                    {/* Content Skeleton */}
                                    <div className="p-5 flex flex-col gap-3">
                                        {/* Source & Date */}
                                        <div className="flex items-center justify-between">
                                            <div className="h-3 w-20 bg-white/10 rounded" />
                                            <div className="h-3 w-16 bg-white/10 rounded" />
                                        </div>

                                        {/* Headline */}
                                        <div className="space-y-2 pt-1">
                                            <div className="h-4 w-full bg-white/10 rounded" />
                                            <div className="h-4 w-2/3 bg-white/10 rounded" />
                                        </div>

                                        {/* Summary */}
                                        <div className="space-y-1.5 pt-2">
                                            <div className="h-3 w-full bg-white/10 rounded" />
                                            <div className="h-3 w-5/6 bg-white/10 rounded" />
                                            <div className="h-3 w-4/6 bg-white/10 rounded" />
                                        </div>

                                        {/* Tags */}
                                        <div className="flex gap-2 pt-2">
                                            <div className="h-5 w-12 bg-white/10 rounded-md" />
                                            <div className="h-5 w-12 bg-white/10 rounded-md" />
                                        </div>
                                    </div>
                                </div>

                                {/* Footer Link Skeleton */}
                                <div className="px-5 pb-5 pt-2 flex justify-end">
                                    <div className="h-3 w-20 bg-white/10 rounded" />
                                </div>
                            </div>
                        ))}
                    </div>
                ) : error ? (
                    <div className="text-center py-20 text-red-400">{error}</div>
                ) : filteredNews.length === 0 ? (
                    <div className="text-center py-20 text-white/40">
                        No articles match your criteria.
                    </div>
                ) : (
                    /* News Grid */
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredNews.map((item) => (
                            <a
                                key={item.id}
                                href={item.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="group border border-white/10 bg-white/5 rounded-2xl overflow-hidden hover:border-white/30 transition-all flex flex-col justify-between"
                            >
                                <div>
                                    {item.image && (
                                        <div className="h-48 w-full overflow-hidden bg-white/5">
                                            <img
                                                src={item.image}
                                                alt={item.headline}
                                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                            />
                                        </div>
                                    )}
                                    <div className="p-5">
                                        <div className="flex items-center justify-between text-xs text-white/40 mb-2">
                                            <span className="font-semibold text-white/60">{item.source}</span>
                                            <span className="flex items-center gap-1">
                                                <FiClock size={12} />
                                                {new Date(item.datetime * 1000).toLocaleDateString()}
                                            </span>
                                        </div>
                                        <h2 className="font-semibold text-base mb-2 group-hover:text-blue-400 transition-colors line-clamp-2">
                                            {item.headline}
                                        </h2>
                                        <p className="text-white/50 text-sm line-clamp-3">
                                            {item.summary}
                                        </p>
                                    </div>
                                </div>
                                <div className="px-5 pb-5 pt-2 flex items-center justify-between text-xs text-white/40 group-hover:text-white transition-colors">
                                    {item.related && (
                                        <span className="px-2 py-0.5 rounded bg-white/10 text-white/70 font-mono text-[10px]">
                                            ${item.related}
                                        </span>
                                    )}
                                    <div className="flex items-center gap-1 ml-auto">
                                        <span>Read Article</span>
                                        <FiExternalLink size={12} />
                                    </div>
                                </div>
                            </a>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}