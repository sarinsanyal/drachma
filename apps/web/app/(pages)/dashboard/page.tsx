"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import Navbar from "@/components/custom/Navbar";
import { Button } from "@/components/ui/button";
import { toast, Toaster } from "sonner";
import { FiLogOut } from "react-icons/fi";

type Profile = {
    id: string;
    email: string;
    name: string;
    username: string;
    phone: string | null;
    bio: string | null;
    image_url: string | null;
    balance: number;
    created_at: string;
};

export default function Dashboard() {
    const supabase = createClient();
    const router = useRouter();
    const [profile, setProfile] = useState<Profile | null>(null);
    const [loading, setLoading] = useState(true);
    const [loggingOut, setLoggingOut] = useState(false);

    useEffect(() => {
        const fetchProfile = async () => {
            const {
                data: { user },
            } = await supabase.auth.getUser();

            if (!user) {
                setLoading(false);
                return;
            }

            const { data, error } = await supabase
                .from("profiles")
                .select("*")
                .eq("id", user.id)
                .single();

            if (error) {
                console.error("Failed to load profile:", error.message);
            } else {
                setProfile(data);
            }

            setLoading(false);
        };

        fetchProfile();
    }, []);

    const handleLogout = async () => {
        setLoggingOut(true);
        const { error } = await supabase.auth.signOut();

        if (error) {
            toast.error(error.message);
            setLoggingOut(false);
            return;
        }

        router.push("/auth");
        router.refresh();
    };

    if (loading) {
        return (
            <div>
                <Navbar />
                <div className="min-h-screen text-white flex items-center justify-center">
                    <p className="text-white/40 text-sm">Loading your dashboard...</p>
                </div>
            </div>
        );
    }

    if (!profile) {
        return (
            <div>
                <Navbar />
                <div className="min-h-screen text-white flex items-center justify-center">
                    <p className="text-white/40 text-sm">Could not load profile.</p>
                </div>
            </div>
        );
    }

    return (
        <div>
            <Toaster />
            <Navbar />
            <div className="min-h-screen text-white flex flex-col items-center justify-center gap-6 px-4 py-12">
                <div className="w-full max-w-md bg-white/5 border border-white/20 backdrop-blur-xl rounded-2xl p-8 flex flex-col items-center gap-4">
                    <div className="w-24 h-24 rounded-full border-2 border-white/20 overflow-hidden flex items-center justify-center bg-white/10">
                        {profile.image_url ? (
                            <img
                                src={profile.image_url}
                                alt={profile.name}
                                className="w-full h-full object-cover"
                            />
                        ) : (
                            <span className="text-3xl font-bold text-white/60">
                                {profile.name.trim().split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)}
                            </span>
                        )}
                    </div>

                    <div className="text-center">
                        <h1 className="text-3xl font-extrabold">{profile.name}</h1>
                        <p className="text-white/50 text-sm">@{profile.username}</p>
                    </div>

                    {profile.bio && (
                        <p className="text-white/60 text-sm text-center">{profile.bio}</p>
                    )}

                    <div className="w-full flex flex-col gap-2 mt-2 text-sm">
                        <div className="flex justify-between border-b border-white/10 pb-2">
                            <span className="text-white/40">Email</span>
                            <span className="text-white/80">{profile.email}</span>
                        </div>
                        <div className="flex justify-between border-b border-white/10 pb-2">
                            <span className="text-white/40">Phone</span>
                            <span className="text-white/80">{profile.phone || "Not set"}</span>
                        </div>
                        <div className="flex justify-between border-b border-white/10 pb-2">
                            <span className="text-white/40">Balance</span>
                            <span className="text-green-400 font-bold">
                                ${profile.balance.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                            </span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-white/40">Joined</span>
                            <span className="text-white/80">
                                {new Date(profile.created_at).toLocaleDateString()}
                            </span>
                        </div>
                    </div>

                    <Button
                        variant="outline"
                        className="w-full flex items-center gap-2 justify-center text-black border-white/20 hover:bg-white/10 hover:text-white cursor-pointer mt-2"
                        onClick={handleLogout}
                        disabled={loggingOut}
                    >
                        <FiLogOut />
                        {loggingOut ? "Logging out..." : "Log out"}
                    </Button>
                </div>

                <p className="text-white/30 text-xs">Trading dashboard coming soon.</p>
            </div>
        </div>
    );
}