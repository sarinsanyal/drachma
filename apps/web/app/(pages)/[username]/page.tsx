"use client";

import { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import Link from "next/link";
import {
    FiEdit2,
    FiCalendar,
    FiTrendingUp,
    FiTrendingDown,
    FiLogOut,
    FiCheck,
    FiX,
    FiEye,
    FiActivity,
    FiSearch
} from "react-icons/fi";
import DashboardNavbar from "@/components/custom/dashboard/Navbar";

// ─── Types ─────────────────────────────────────────────────────────────────────
type Profile = {
    id: string;
    name: string;
    username: string;
    image_url: string | null;
    bio: string | null;
    balance: number;
    created_at: string;
};

type Trade = {
    id: number;
    symbol: string;
    quantity: number;
    price: number;
    type: string;
    created_at: string;
};

type WatchlistItem = {
    id: number;
    symbol: string;
};

// ─── Functions ────────────────────────────────────────────────────────────────────

function getInitials(name: string) {
    return name.trim().split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2) || "?";
}

function formatJoinDate(dateStr: string) {
    return new Date(dateStr).toLocaleDateString("en-US", { month: "long", year: "numeric" });
}

function formatCurrency(n: number) {
    return n.toLocaleString("en-US", { style: "currency", currency: "USD" });
}

export default function PublicProfilePage() {
    const params = useParams<{ username: string }>();
    const router = useRouter();
    const supabase = createClient();

    const [profile, setProfile] = useState<Profile | null>(null);
    const [loading, setLoading] = useState(true);
    const [notFound, setNotFound] = useState(false);
    const [isOwner, setIsOwner] = useState(false);

    const [tradeCount, setTradeCount] = useState<number | null>(null);
    const [watchlistCount, setWatchlistCount] = useState<number | null>(null);
    const [allTrades, setAllTrades] = useState<Trade[]>([]);

    // Owner trade filters
    const [searchQuery, setSearchQuery] = useState("");
    const [displayLimit, setDisplayLimit] = useState<number | "all">(10);
    const [watchlist, setWatchlist] = useState<WatchlistItem[]>([]);

    // edit state
    const [editing, setEditing] = useState(false);
    const [saving, setSaving] = useState(false);
    const [avatarUploading, setAvatarUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [form, setForm] = useState({ name: "", bio: "", image_url: "" });

    useEffect(() => {
        const fetchProfile = async () => {
            const username = params.username;
            if (!username) return;

            const { data: profileData, error } = await supabase
                .from("profiles")
                .select("id, name, username, image_url, bio, balance, created_at")
                .eq("username", username)
                .single();

            if (error || !profileData) {
                setNotFound(true);
                setLoading(false);
                return;
            }

            setProfile(profileData);
            setForm({
                name: profileData.name ?? "",
                bio: profileData.bio ?? "",
                image_url: profileData.image_url ?? "",
            });

            const { data: { user } } = await supabase.auth.getUser();
            const ownerStatus = Boolean(user && user.id === profileData.id);
            setIsOwner(ownerStatus);

            const { count: tCount } = await supabase
                .from("trades")
                .select("id", { count: "exact", head: true })
                .eq("profile_id", profileData.id);
            setTradeCount(tCount ?? 0);

            const { count: wCount } = await supabase
                .from("watchlist")
                .select("id", { count: "exact", head: true })
                .eq("user_id", profileData.id);
            setWatchlistCount(wCount ?? 0);

            // Fetch transaction history ONLY if profile owner
            if (ownerStatus) {
                const { data: trades } = await supabase
                    .from("trades")
                    .select("id, symbol, quantity, price, type, created_at")
                    .eq("profile_id", profileData.id)
                    .order("created_at", { ascending: false });
                setAllTrades(trades ?? []);

                // 2. Fetch watchlist items (ADD THIS)
                const { data: watchlistItems } = await supabase
                    .from("watchlist")
                    .select("id, symbol")
                    .eq("user_id", profileData.id);
                setWatchlist(watchlistItems ?? []);
            }

            setLoading(false);
        };

        fetchProfile();
    }, [params.username]);

    const handleSave = async () => {
        if (!profile) return;
        setSaving(true);

        const { error } = await supabase
            .from("profiles")
            .update({
                name: form.name.trim(),
                bio: form.bio.trim(),
                image_url: form.image_url.trim() || null,
            })
            .eq("id", profile.id);

        setSaving(false);

        if (error) {
            toast.error(error.message);
            return;
        }

        setProfile({ ...profile, name: form.name.trim(), bio: form.bio.trim(), image_url: form.image_url.trim() || null });
        setEditing(false);
        toast.success("Profile updated");
    };

    const handleLogout = async () => {
        const { error } = await supabase.auth.signOut();
        if (error) {
            toast.error(error.message);
            return;
        }
        router.push("/auth");
        router.refresh();
    };

    const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !profile) return;

        if (!file.type.startsWith("image/")) {
            toast.error("Please upload an image file");
            return;
        }
        if (file.size > 5 * 1024 * 1024) {
            toast.error("Image must be under 5MB");
            return;
        }

        setAvatarUploading(true);

        const ext = file.name.split(".").pop();
        const path = `${profile.id}/avatar-${Date.now()}.${ext}`;

        const { error: uploadError } = await supabase.storage
            .from("avatars")
            .upload(path, file, { upsert: true });

        if (uploadError) {
            toast.error(uploadError.message);
            setAvatarUploading(false);
            return;
        }

        const { data: { publicUrl } } = supabase.storage.from("avatars").getPublicUrl(path);

        const { error: updateError } = await supabase
            .from("profiles")
            .update({ image_url: publicUrl })
            .eq("id", profile.id);

        setAvatarUploading(false);

        if (updateError) {
            toast.error(updateError.message);
            return;
        }

        setProfile({ ...profile, image_url: publicUrl });
        setForm({ ...form, image_url: publicUrl });
        toast.success("Avatar updated");
    };

    // Filter trades based on search query
    const filteredTrades = allTrades.filter((t) =>
        t.symbol.toLowerCase().includes(searchQuery.toLowerCase().trim()) ||
        t.type.toLowerCase().includes(searchQuery.toLowerCase().trim())
    );

    const displayedTrades = displayLimit === "all"
        ? filteredTrades
        : filteredTrades.slice(0, displayLimit);

    if (loading) {
        return (
            <div className="min-h-screen text-white">
                <DashboardNavbar />
                <div className="max-w-5xl mx-auto mt-10 px-4">
                    <div className="bg-white/5 border border-white/10 rounded-2xl p-8 animate-pulse max-w-2xl">
                        <div className="w-24 h-24 rounded-full bg-white/10 mb-4" />
                        <div className="h-5 w-40 bg-white/10 rounded mb-2" />
                        <div className="h-3 w-24 bg-white/10 rounded" />
                    </div>
                </div>
            </div>
        );
    }

    if (notFound || !profile) {
        return (
            <div className="min-h-screen text-white">
                <DashboardNavbar />
                <div className="flex flex-col items-center justify-center gap-3 py-32 text-center">
                    <p className="text-lg font-semibold">This page doesn't exist.</p>
                    <Link href="/" className="text-sm text-purple-400 hover:text-purple-300 transition-colors">
                        ← Back to Main Page
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen text-white">
            <DashboardNavbar />

            <div className="max-w-5xl mx-auto mt-10 px-4 pb-16">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                    {/* LEFT COLUMN: Profile Header Card & Logout */}
                    <div className="lg:col-span-1 flex flex-col gap-6">
                        <div className="bg-white/5 border border-white/20 backdrop-blur-xl rounded-2xl overflow-hidden">
                            {/* banner */}
                            <div className="h-24 w-full bg-linear-to-r from-purple-700/40 via-indigo-600/30 to-blue-600/40" />

                            <div className="px-6 pb-6 -mt-10">
                                <div className="flex items-start justify-between">
                                    <div className="relative w-20 h-20 rounded-full border-4 border-[#0a0a0f] overflow-hidden flex items-center justify-center bg-white/10 shrink-0 shadow-lg group">
                                        {profile.image_url ? (
                                            <img src={profile.image_url} alt={profile.name} className="w-full h-full object-cover" />
                                        ) : (
                                            <span className="text-xl font-bold text-white/70">{getInitials(profile.name)}</span>
                                        )}

                                        {isOwner && editing && (
                                            <button
                                                onClick={() => fileInputRef.current?.click()}
                                                disabled={avatarUploading}
                                                className="absolute inset-0 flex items-center justify-center bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer text-xs font-semibold"
                                            >
                                                {avatarUploading ? "..." : "Change"}
                                            </button>
                                        )}
                                        <input
                                            ref={fileInputRef}
                                            type="file"
                                            accept="image/*"
                                            onChange={handleAvatarUpload}
                                            className="hidden"
                                        />
                                    </div>

                                    {isOwner && !editing && (
                                        <button
                                            onClick={() => setEditing(true)}
                                            className="mt-12 flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-lg border border-white/20 hover:bg-white/10 transition-colors cursor-pointer"
                                        >
                                            <FiEdit2 size={13} />
                                            Edit profile
                                        </button>
                                    )}
                                </div>

                                <div className="mt-3">
                                    <h1 className="text-xl font-extrabold">{profile.name}</h1>
                                    <p className="text-white/40 text-xs">@{profile.username}</p>
                                </div>

                                {!editing && (
                                    <>
                                        {profile.bio && <p className="text-sm text-white/60 mt-4 leading-relaxed">{profile.bio}</p>}
                                        <div className="flex items-center gap-1.5 text-xs text-white/40 mt-4">
                                            <FiCalendar size={12} />
                                            Joined {formatJoinDate(profile.created_at)}
                                        </div>
                                    </>
                                )}

                                {editing && (
                                    <div className="mt-6 flex flex-col gap-3">
                                        <div>
                                            <label className="text-xs text-white/40 mb-1 block">Name</label>
                                            <input
                                                value={form.name}
                                                onChange={(e) => setForm({ ...form, name: e.target.value })}
                                                className="w-full bg-white/5 border border-white/20 rounded-lg px-3 py-2 text-sm outline-none focus:border-purple-400 transition-colors"
                                            />
                                        </div>
                                        <div>
                                            <label className="text-xs text-white/40 mb-1 block">Bio</label>
                                            <textarea
                                                value={form.bio}
                                                onChange={(e) => setForm({ ...form, bio: e.target.value })}
                                                rows={3}
                                                className="w-full bg-white/5 border border-white/20 rounded-lg px-3 py-2 text-sm outline-none focus:border-purple-400 transition-colors resize-none"
                                            />
                                        </div>
                                        <div className="flex gap-2 mt-2">
                                            <button
                                                onClick={handleSave}
                                                disabled={saving}
                                                className="flex items-center gap-1.5 text-xs font-semibold px-4 py-2 rounded-lg bg-purple-700 hover:bg-purple-800 transition-colors cursor-pointer disabled:opacity-50"
                                            >
                                                <FiCheck size={13} />
                                                {saving ? "Saving..." : "Save"}
                                            </button>
                                            <button
                                                onClick={() => {
                                                    setEditing(false);
                                                    setForm({ name: profile.name, bio: profile.bio ?? "", image_url: profile.image_url ?? "" });
                                                }}
                                                className="flex items-center gap-1.5 text-xs font-semibold px-4 py-2 rounded-lg border border-white/20 hover:bg-white/10 transition-colors cursor-pointer"
                                            >
                                                <FiX size={13} />
                                                Cancel
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Owner-only: logout button */}
                        {isOwner && (
                            <button
                                onClick={handleLogout}
                                className="flex items-center justify-center gap-2 w-full text-sm font-semibold text-red-400 bg-red-500/5 hover:bg-red-500/10 border border-red-500/20 hover:border-red-500/30 rounded-2xl py-3.5 transition-colors cursor-pointer"
                            >
                                <FiLogOut size={15} />
                                Log out
                            </button>
                        )}
                    </div>

                    {/* RIGHT COLUMN: Stats & Portfolio Content */}
                    <div className="lg:col-span-2 flex flex-col gap-6">
                        {/* Stats Cards */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            <div className="bg-white/5 border border-white/20 backdrop-blur-xl rounded-2xl p-5">
                                <p className="text-white/40 text-xs mb-1 flex items-center gap-1.5">
                                    <FiActivity size={12} />
                                    Total trades
                                </p>
                                <p className="text-xl font-bold">{tradeCount ?? "—"}</p>
                            </div>
                            {/* Owner-Only: Interactive Watchlist */}
                            {isOwner && (
                                <div className="bg-white/5 border border-white/20 backdrop-blur-xl rounded-2xl overflow-hidden flex-1 flex flex-col">
                                    <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between">
                                        <h2 className="text-sm font-bold text-white/70">Watchlist</h2>
                                        <span className="text-xs text-white/40">{watchlist.length} saved</span>
                                    </div>

                                    {watchlist.length === 0 ? (
                                        <p className="text-xs text-white/30 px-6 py-8 text-center">No symbols in your watchlist yet.</p>
                                    ) : (
                                        <div className="divide-y divide-white/5 overflow-y-auto max-h-62.5 scrollbar-none [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
                                            {watchlist.map((item) => (
                                                <Link
                                                    key={item.id}
                                                    href={`/dashboard/stocks/${item.symbol}`}
                                                    className="flex items-center justify-between px-6 py-3.5 hover:bg-white/10 transition-colors group"
                                                >
                                                    <span className="text-sm font-bold text-white group-hover:text-purple-400 transition-colors">
                                                        ${item.symbol.toUpperCase()}
                                                    </span>
                                                    <span className="text-xs text-purple-400 opacity-0 group-hover:opacity-100 transition-opacity">
                                                        View Stock →
                                                    </span>
                                                </Link>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}
                            <div className="bg-white/5 border border-white/20 backdrop-blur-xl rounded-2xl p-5">
                                <p className="text-white/40 text-xs mb-1">
                                    {isOwner ? "Cash balance" : "Member since"}
                                </p>
                                <p className="text-xl font-bold">
                                    {isOwner ? formatCurrency(profile.balance) : formatJoinDate(profile.created_at).split(" ")[1]}
                                </p>
                            </div>
                        </div>

                        {/* Owner-Only: Full Trade History with Search & Controls */}
                        {isOwner && (
                            <div className="bg-white/5 border border-white/20 backdrop-blur-xl rounded-2xl overflow-hidden flex-1 flex flex-col">
                                <div className="px-6 py-4 border-b border-white/10 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                                    <h2 className="text-sm font-bold text-white/70 shrink-0">Transaction History</h2>

                                    {/* Search Bar & View Filter */}
                                    <div className="flex items-center gap-2 w-full sm:w-auto">
                                        <div className="relative flex-1 sm:w-48">
                                            <FiSearch size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-white/40" />
                                            <input
                                                type="text"
                                                placeholder="Search symbol..."
                                                value={searchQuery}
                                                onChange={(e) => setSearchQuery(e.target.value)}
                                                className="w-full bg-white/5 border border-white/10 rounded-lg pl-8 pr-3 py-1.5 text-xs text-white placeholder:text-white/30 outline-none focus:border-purple-400 transition-colors"
                                            />
                                        </div>

                                        <div className="flex bg-white/5 border border-white/10 rounded-lg p-0.5 text-xs shrink-0">
                                            <button
                                                onClick={() => setDisplayLimit(5)}
                                                className={`px-2 py-1 rounded-md transition-colors cursor-pointer ${displayLimit === 5 ? "bg-purple-600 text-white font-semibold" : "text-white/50 hover:text-white"}`}
                                            >
                                                5
                                            </button>
                                            <button
                                                onClick={() => setDisplayLimit(10)}
                                                className={`px-2 py-1 rounded-md transition-colors cursor-pointer ${displayLimit === 10 ? "bg-purple-600 text-white font-semibold" : "text-white/50 hover:text-white"}`}
                                            >
                                                10
                                            </button>
                                            <button
                                                onClick={() => setDisplayLimit("all")}
                                                className={`px-2 py-1 rounded-md transition-colors cursor-pointer ${displayLimit === "all" ? "bg-purple-600 text-white font-semibold" : "text-white/50 hover:text-white"}`}
                                            >
                                                All
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                {displayedTrades.length === 0 ? (
                                    <p className="text-xs text-white/30 px-6 py-8 text-center">
                                        {searchQuery ? "No trades found matching search." : "No trades recorded yet."}
                                    </p>
                                ) : (
                                    <div className="divide-y divide-white/5 overflow-y-auto max-h-105 scrollbar-none [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
                                        {displayedTrades.map((t) => {
                                            const isBuy = t.type === "buy";
                                            const date = new Date(t.created_at);
                                            const label = date.toLocaleString("en-US", {
                                                month: "short",
                                                day: "numeric",
                                                year: "numeric",
                                                hour: "numeric",
                                                minute: "2-digit",
                                                hour12: true,
                                            });
                                            return (
                                                <div key={t.id} className="flex items-center justify-between px-6 py-3.5 hover:bg-white/5 transition-colors">
                                                    <div className="flex items-center gap-3">
                                                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold ${isBuy ? "bg-green-400/10 text-green-400" : "bg-red-400/10 text-red-400"}`}>
                                                            {isBuy ? <FiTrendingUp size={14} /> : <FiTrendingDown size={14} />}
                                                        </div>
                                                        <div>
                                                            <p className="text-sm font-semibold text-white">
                                                                {isBuy ? "Bought" : "Sold"} {t.symbol}
                                                            </p>
                                                            <p className="text-xs text-white/40">{t.quantity} shares @ {formatCurrency(t.price)}</p>
                                                        </div>
                                                    </div>
                                                    <p className="text-xs text-white/40">{label}</p>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                </div>
            </div>
        </div>
    );
}