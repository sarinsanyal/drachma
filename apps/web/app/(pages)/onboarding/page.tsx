"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { toast, Toaster } from "sonner";
import { FaCheck, FaTimes } from "react-icons/fa";
import Image from "next/image";

type AvailabilityStatus = "idle" | "checking" | "available" | "taken";

function getInitialsAvatar(name: string) {
    const initials = name.trim().split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
    return initials || "?";
}

export default function OnboardingPage() {
    const supabase = createClient();
    const router = useRouter();
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [user, setUser] = useState<any>(null);
    const [name, setName] = useState("");
    const [username, setUsername] = useState("");
    const [phone, setPhone] = useState("");
    const [bio, setBio] = useState("");
    const [avatarUrl, setAvatarUrl] = useState("");
    const [avatarPreview, setAvatarPreview] = useState("");
    const [avatarFile, setAvatarFile] = useState<File | null>(null);
    const [usernameStatus, setUsernameStatus] = useState<AvailabilityStatus>("idle");
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        supabase.auth.getUser().then(({ data: { user } }) => {
            if (!user) { router.push("/auth"); return; }
            setUser(user);
            setName(user.user_metadata?.full_name || user.user_metadata?.name || "");
            setUsername(user.user_metadata?.user_name || "");
            setAvatarUrl(user.user_metadata?.avatar_url || "");
            setAvatarPreview(user.user_metadata?.avatar_url || "");
        });
    }, []);

    const checkUsername = useCallback(async (value: string) => {
        if (value.length < 3) { setUsernameStatus("idle"); return; }
        setUsernameStatus("checking");
        const { data } = await supabase
            .from("profiles")
            .select("username")
            .eq("username", value)
            .single();
        setUsernameStatus(data ? "taken" : "available");
    }, []);

    useEffect(() => {
        const timer = setTimeout(() => {
            if (username) checkUsername(username);
        }, 500);
        return () => clearTimeout(timer);
    }, [username]);

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        if (file.size > 2 * 1024 * 1024) { toast.error("Image must be under 2MB"); return; }
        setAvatarFile(file);
        setAvatarPreview(URL.createObjectURL(file));
    };

    const handleSubmit = async () => {
        if (!name.trim()) { toast.error("Name is required"); return; }
        if (!username.trim()) { toast.error("Username is required"); return; }
        if (usernameStatus === "taken") { toast.error("Username is taken"); return; }
        if (usernameStatus === "checking") { toast.error("Wait for username check"); return; }
        if (username.length < 3) { toast.error("Username must be at least 3 characters"); return; }

        setLoading(true);

        let finalImageUrl = avatarUrl;

        if (avatarFile) {
            const fileExt = avatarFile.name.split(".").pop();
            const filePath = `${user.id}/avatar.${fileExt}`;
            const { error: uploadError } = await supabase.storage
                .from("avatar")
                .upload(filePath, avatarFile, { upsert: true });

            if (uploadError) {
                toast.error("Image upload failed");
                setLoading(false);
                return;
            }

            const { data: urlData } = supabase.storage.from("avatar").getPublicUrl(filePath);
            finalImageUrl = urlData.publicUrl;
        }

        const { error } = await supabase.from("profiles").insert({
            id: user.id,
            email: user.email,
            name: name.trim(),
            username: username.trim().toLowerCase(),
            phone: phone.trim() || null,
            bio: bio.trim() || null,
            image_url: finalImageUrl || null,
        });

        if (error) {
            toast.error(error.message);
            setLoading(false);
            return;
        }

        router.push("/dashboard");
    };

    const usernameStatusIcon = {
        idle: null,
        checking: <span className="text-white/40 text-xs">Checking...</span>,
        available: <FaCheck className="text-green-400 text-xs" />,
        taken: <FaTimes className="text-red-400 text-xs" />,
    }[usernameStatus];

    return (
        <div className="min-h-screen text-white flex flex-col items-center justify-center px-4 py-12">
            <Toaster />
            <div className="w-full max-w-6xl flex flex-col lg:flex-row gap-10 items-stretch justify-center">

                {/* Left — image + quote */}
                <div className="hidden lg:flex w-full lg:w-1/2 flex-col items-center justify-center gap-8 bg-white/5 border border-white/20 backdrop-blur-xl rounded-2xl p-10 relative overflow-hidden">
                    <div className="relative w-full h-72 rounded-xl overflow-hidden">
                        <Image
                            src="/diagrams/complete-profile.jpg"
                            alt="Trading illustration"
                            fill
                            className="object-cover"
                        />
                    </div>
                    <div className="text-center flex flex-col gap-3">
                        <p className="text-2xl font-extrabold text-white leading-snug">
                            "The stock market is a device for transferring money from the impatient to the patient."
                        </p>
                        <p className="text-white/50 text-sm">— Warren Buffett</p>
                    </div>
                </div>

                {/* Right — form */}
                <div className="w-full lg:w-1/2 flex flex-col gap-6 bg-white/5 border border-white/20 backdrop-blur-xl rounded-2xl p-8">
                    <div className="text-center">
                        <h1 className="text-4xl font-extrabold mb-2">
                            Complete your <span className="text-white">profile</span>
                        </h1>
                        <p className="text-white/50 text-sm">Just a few things before you start trading</p>
                    </div>

                    {/* Avatar upload */}
                    <div className="flex flex-col items-center gap-3">
                        <div
                            onClick={() => fileInputRef.current?.click()}
                            className="w-24 h-24 rounded-full border-2 border-white/20 cursor-pointer overflow-hidden flex items-center justify-center bg-white/10 hover:border-purple-500 transition-all"
                        >
                            {avatarPreview ? (
                                <img src={avatarPreview} alt="Avatar" className="w-full h-full object-cover" />
                            ) : (
                                <span className="text-3xl font-bold text-white/60">
                                    {getInitialsAvatar(name)}
                                </span>
                            )}
                        </div>
                        <p
                            className="text-white/40 text-xs cursor-pointer hover:text-white/70 transition"
                            onClick={() => fileInputRef.current?.click()}
                        >
                            Click to upload photo
                        </p>
                        <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
                    </div>

                    {/* Name */}
                    <div className="flex flex-col gap-1">
                        <label className="text-sm text-white/60">Full Name</label>
                        <input
                            type="text"
                            placeholder="John Doe"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="w-full px-4 py-2 rounded-md bg-white/10 border border-white/20 text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-purple-500"
                        />
                    </div>

                    {/* Username */}
                    <div className="flex flex-col gap-1">
                        <label className="text-sm text-white/60">Username</label>
                        <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30">@</span>
                            <input
                                type="text"
                                placeholder="johndoe"
                                value={username}
                                onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/\s/g, ""))}
                                className="w-full pl-7 pr-10 py-2 rounded-md bg-white/10 border border-white/20 text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-purple-500"
                            />
                            <div className="absolute right-3 top-1/2 -translate-y-1/2">
                                {usernameStatusIcon}
                            </div>
                        </div>
                        <p className="text-white/30 text-xs">{username.length}/20 characters</p>
                    </div>

                    {/* Bio */}
                    <div className="flex flex-col gap-1">
                        <label className="text-sm text-white/60">Bio <span className="text-white/30">(optional)</span></label>
                        <input
                            type="text"
                            placeholder="Aspiring trader. Risk taker."
                            value={bio}
                            maxLength={100}
                            onChange={(e) => setBio(e.target.value)}
                            className="w-full px-4 py-2 rounded-md bg-white/10 border border-white/20 text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-purple-500"
                        />
                        <p className="text-white/30 text-xs">{bio.length}/100 characters</p>
                    </div>

                    {/* Phone */}
                    <div className="flex flex-col gap-1">
                        <label className="text-sm text-white/60">Phone <span className="text-white/30">(optional)</span></label>
                        <input
                            type="tel"
                            placeholder="+91 98765 43210"
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                            className="w-full px-4 py-2 rounded-md bg-white/10 border border-white/20 text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-purple-500"
                        />
                    </div>

                    {/* Leaderboard preview */}
                    <div className="bg-white/5 border border-white/10 rounded-xl p-4 flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full border border-white/20 overflow-hidden flex items-center justify-center bg-white/10 flex-shrink-0">
                            {avatarPreview ? (
                                <img src={avatarPreview} alt="Avatar" className="w-full h-full object-cover" />
                            ) : (
                                <span className="text-sm font-bold text-white/60">
                                    {getInitialsAvatar(name)}
                                </span>
                            )}
                        </div>
                        <div className="flex flex-col flex-1 min-w-0">
                            <span className="font-bold text-white text-sm truncate">{name || "Your Name"}</span>
                            <span className="text-white/50 text-xs">@{username || "username"}</span>
                            {bio && <span className="text-white/40 text-xs mt-0.5 truncate">{bio}</span>}
                        </div>
                        <div className="flex flex-col items-end flex-shrink-0">
                            <span className="text-green-400 font-bold text-sm">$10,000.00</span>
                            <span className="text-white/40 text-xs">Balance</span>
                        </div>
                    </div>

                    <Button
                        className="w-full bg-purple-700 hover:bg-purple-800 text-white cursor-pointer"
                        onClick={handleSubmit}
                        disabled={loading || usernameStatus === "taken" || usernameStatus === "checking"}
                    >
                        {loading ? "Setting up your account..." : "Enter the market"}
                    </Button>
                </div>

            </div>
        </div>
    );
}