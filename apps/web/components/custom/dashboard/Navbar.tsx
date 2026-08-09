"use client";

import Link from "next/link";
import { useState, useEffect, useRef } from "react";
import { usePathname, useRouter } from "next/navigation";
import { AuroraText } from "../../magicui/aurora-text";
import { Menu, X, ChevronDown, LogOut, User } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";

type Profile = {
    name: string;
    username: string;
    image_url: string | null;
};

const NAV_LINKS = [
    { href: "/dashboard", label: "Dashboard" },
    { href: "/dashboard/stocks", label: "Stocks" },
    { href: "/dashboard/news", label: "News" },
    { href: "/blog", label: "Learn" },
];

function getInitials(name: string) {
    return name.trim().split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2) || "?";
}

export default function DashboardNavbar() {
    const [menuOpen, setMenuOpen] = useState(false);
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const [profile, setProfile] = useState<Profile | null>(null);
    const supabase = createClient();
    const router = useRouter();
    const pathname = usePathname();
    const dropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const fetchProfile = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const { data } = await supabase
                .from("profiles")
                .select("name, username, image_url")
                .eq("id", user.id)
                .single();

            if (data) setProfile(data);
        };
        fetchProfile();
    }, []);

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
                setDropdownOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleLogout = async () => {
        const { error } = await supabase.auth.signOut();
        if (error) {
            toast.error(error.message);
            return;
        }
        router.push("/auth");
        router.refresh();
    };

    return (
        <nav className="w-full px-6 py-4 font-(family-name:--font-geist-sans) bg-transparent z-50">
            <div className="flex items-center justify-between">
                <div className="font-extrabold text-xl md:text-3xl">
                    <Link href="/dashboard">
                        <AuroraText> Drachma</AuroraText>
                    </Link>
                </div>

                <div className="hidden md:flex gap-4 font-bold text-md md:text-lg">
                    {NAV_LINKS.map(({ href, label }) => {
                        const active = pathname === href;
                        return (
                            <Link
                                key={href}
                                href={href}
                                className={`px-3 transition-colors duration-250 ${
                                    active ? "text-white" : "text-gray-300 hover:text-white"
                                }`}
                            >
                                {label}
                            </Link>
                        );
                    })}
                </div>

                <div className="hidden md:flex items-center gap-3">
                    <div className="relative" ref={dropdownRef}>
                        <button
                            onClick={() => setDropdownOpen((v) => !v)}
                            className="flex items-center gap-2 pl-1 pr-2 py-1 rounded-full hover:bg-white/5 transition-colors cursor-pointer"
                        >
                            <div className="w-9 h-9 rounded-full border-2 border-blue-400 overflow-hidden flex items-center justify-center bg-white/10 shrink-0">
                                {profile?.image_url ? (
                                    <img src={profile.image_url} alt={profile.name} className="w-full h-full object-cover" />
                                ) : (
                                    <span className="text-xs font-bold text-white/70">
                                        {profile ? getInitials(profile.name) : "?"}
                                    </span>
                                )}
                            </div>
                            <ChevronDown size={14} className={`text-gray-300 transition-transform ${dropdownOpen ? "rotate-180" : ""}`} />
                        </button>

                        {dropdownOpen && (
                            <div className="absolute right-0 top-12 w-56 bg-[#0a0a0f] border-2 border-blue-400/30 rounded-lg shadow-xl overflow-hidden z-1">
                                {profile && (
                                    <div className="px-4 py-3 border-b border-white/10">
                                        <p className="text-sm font-bold text-white truncate">{profile.name}</p>
                                        <p className="text-xs text-gray-400 truncate">@{profile.username}</p>
                                    </div>
                                )}
                                <Link
                                    href={profile ? `/@${profile.username}` : "#"}
                                    onClick={() => setDropdownOpen(false)}
                                    className="flex items-center gap-2 px-4 py-2.5 text-sm text-gray-300 hover:bg-white/5 hover:text-white transition-colors"
                                >
                                    <User size={15} />
                                    View profile
                                </Link>
                                <button
                                    onClick={handleLogout}
                                    className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-red-400 hover:bg-red-500/10 transition-colors cursor-pointer"
                                >
                                    <LogOut size={15} />
                                    Log out
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                <div className="md:hidden">
                    <button onClick={() => setMenuOpen(!menuOpen)} className="text-white focus:outline-none">
                        {menuOpen ? <X size={24} /> : <Menu size={24} />}
                    </button>
                </div>
            </div>

            {menuOpen && (
                <div className="mt-4 flex flex-col gap-3 md:hidden font-bold">
                    {NAV_LINKS.map(({ href, label }) => {
                        const active = pathname === href;
                        return (
                            <Link
                                key={href}
                                href={href}
                                onClick={() => setMenuOpen(false)}
                                className={`px-3 transition-colors duration-250 ${
                                    active ? "text-white" : "text-gray-300 hover:text-white"
                                }`}
                            >
                                {label}
                            </Link>
                        );
                    })}

                    <div className="flex items-center gap-3 mt-2 px-3">
                        <div className="w-9 h-9 rounded-full border-2 border-blue-400 overflow-hidden flex items-center justify-center bg-white/10 shrink-0">
                            {profile?.image_url ? (
                                <img src={profile.image_url} alt={profile.name} className="w-full h-full object-cover" />
                            ) : (
                                <span className="text-xs font-bold text-white/70">
                                    {profile ? getInitials(profile.name) : "?"}
                                </span>
                            )}
                        </div>
                        <div>
                            <p className="text-sm text-white truncate">{profile?.name}</p>
                            <p className="text-xs text-gray-400 truncate">@{profile?.username}</p>
                        </div>
                    </div>

                    <Link
                        href={profile ? `/${profile.username}` : "#"}
                        onClick={() => setMenuOpen(false)}
                        className="px-3 text-gray-300 hover:text-white transition-colors duration-250"
                    >
                        View profile
                    </Link>
                    <button
                        onClick={handleLogout}
                        className="text-left px-3 text-red-400 hover:text-red-300 transition-colors duration-250"
                    >
                        Log out
                    </button>
                </div>
            )}
        </nav>
    );
}