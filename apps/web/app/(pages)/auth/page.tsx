"use client";

import { useState } from "react";
import Navbar from "@/components/custom/Navbar";
import { FcGoogle } from "react-icons/fc";
import { FaGithub, FaEye, FaEyeSlash } from "react-icons/fa";
import { toast, Toaster } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

function getPasswordStrength(password: string): { label: string; color: string; width: string } {
    if (password.length === 0) return { label: "", color: "", width: "0%" };
    if (password.length < 6) return { label: "Weak", color: "bg-red-500", width: "25%" };
    if (password.length < 10 && !/[^a-zA-Z0-9]/.test(password)) return { label: "Fair", color: "bg-yellow-500", width: "50%" };
    if (password.length >= 10 && /[^a-zA-Z0-9]/.test(password) && /[0-9]/.test(password)) return { label: "Strong", color: "bg-green-500", width: "100%" };
    return { label: "Medium", color: "bg-blue-400", width: "75%" };
}

export default function AuthPage() {
    const supabase = createClient();
    const router = useRouter();
    const [mode, setMode] = useState<"login" | "signup">("login");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
    const [loading, setLoading] = useState(false);

    const strength = getPasswordStrength(password);

    const handleEmailAuth = async () => {
        if (mode === "signup") {
            if (password !== confirmPassword) { toast.error("Passwords do not match"); return; }
            if (strength.label === "Weak") { toast.error("Password is too weak"); return; }
            setLoading(true);
            const { error } = await supabase.auth.signUp({
                email,
                password,
                options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
            });
            if (error) toast.error(error.message);
            else toast.success("Check your email to confirm your account!");
        } else {
            setLoading(true);
            const { error } = await supabase.auth.signInWithPassword({ email, password });
            if (error) toast.error(error.message);
            else router.push("/dashboard");
        }
        setLoading(false);
    };

    const handleGoogle = async () => {
        await supabase.auth.signInWithOAuth({
            provider: "google",
            options: { redirectTo: `${window.location.origin}/auth/callback` },
        });
    };

    const handleGithub = async () => {
        await supabase.auth.signInWithOAuth({
            provider: "github",
            options: { redirectTo: `${window.location.origin}/auth/callback` },
        });
    };

    const switchMode = (newMode: "login" | "signup") => {
        setMode(newMode);
        setEmail("");
        setPassword("");
        setConfirmPassword("");
        setShowPassword(false);
        setShowConfirm(false);
    };

    return (
        <div>
            <Toaster />
            <Navbar />
            <div className="flex h-[calc(100vh-10px)] items-center justify-center px-4 md:px-8 lg:px-16 bg-transparent text-white">
                <div className="hidden lg:flex flex-col text-center justify-center pt-12 pb-12 w-1/2">
                    <h1 className="text-5xl font-extrabold mb-4">From the chaos of the market to the calm of mastery,</h1>
                    <h1 className="text-5xl font-extrabold bg-clip-text text-transparent bg-linear-to-r from-purple-500 via-blue-500 to-pink-500">
                        Conquer Drachma and rewrite your financial fate.
                    </h1>
                </div>

                <div className="w-full sm:w-96 lg:w-1/2 flex justify-center">
                    <Card className="w-full max-w-md shadow-md backdrop-blur-3xl bg-transparent/50 text-white">
                        <CardHeader>
                            <div className="flex rounded-lg overflow-hidden border border-white/20 mb-2">
                                <button
                                    onClick={() => switchMode("login")}
                                    className={`flex-1 py-2 text-sm font-semibold transition-colors cursor-pointer ${mode === "login" ? "bg-purple-800 text-white" : "bg-transparent text-white/50 hover:text-white"}`}
                                >
                                    Log In
                                </button>
                                <button
                                    onClick={() => switchMode("signup")}
                                    className={`flex-1 py-2 text-sm font-semibold transition-colors cursor-pointer ${mode === "signup" ? "bg-purple-800 text-white" : "bg-transparent text-white/50 hover:text-white"}`}
                                >
                                    Sign Up
                                </button>
                            </div>
                            <CardTitle className="text-center text-2xl font-bold">
                                {mode === "login" ? "Log in to Drachma" : "Create your account"}
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="flex flex-col gap-4 mt-2">
                                <input
                                    type="email"
                                    placeholder="Email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="w-full px-4 py-2 rounded-md bg-white/10 border border-white/20 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-purple-600"
                                />

                                <div className="relative">
                                    <input
                                        type={showPassword ? "text" : "password"}
                                        placeholder="Password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        className="w-full px-4 py-2 rounded-md bg-white/10 border border-white/20 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-purple-500 pr-10"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-white/50 hover:text-white cursor-pointer"
                                    >
                                        {showPassword ? <FaEyeSlash /> : <FaEye />}
                                    </button>
                                </div>

                                {mode === "signup" && password.length > 0 && (
                                    <div className="space-y-1">
                                        <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
                                            <div
                                                className={`h-full rounded-full transition-all duration-300 ${strength.color}`}
                                                style={{ width: strength.width }}
                                            />
                                        </div>
                                        <p className={`text-xs ${strength.color.replace("bg-", "text-")}`}>
                                            {strength.label}
                                        </p>
                                    </div>
                                )}

                                {mode === "signup" && (
                                    <div className="relative">
                                        <input
                                            type="password"
                                            placeholder="Confirm Password"
                                            value={confirmPassword}
                                            onChange={(e) => setConfirmPassword(e.target.value)}
                                            className={`w-full px-4 py-2 rounded-md bg-white/10 border text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-purple-600 pr-10 ${confirmPassword.length > 0 && confirmPassword !== password
                                                    ? "border-red-500"
                                                    : "border-white/20"
                                                }`}
                                        />
                                    </div>
                                )}

                                <Button
                                    className="w-full bg-purple-700 hover:bg-purple-800 text-white cursor-pointer"
                                    onClick={handleEmailAuth}
                                    disabled={loading}
                                >
                                    {loading
                                        ? (mode === "login" ? "Logging in..." : "Creating account...")
                                        : (mode === "login" ? "Log In" : "Sign Up")}
                                </Button>

                                <div className="flex items-center gap-2">
                                    <div className="flex-1 h-px bg-white/20" />
                                    <span className="text-white/50 text-sm">or</span>
                                    <div className="flex-1 h-px bg-white/20" />
                                </div>

                                <Button
                                    variant="outline"
                                    className="w-full flex items-center text-black gap-2 justify-center cursor-pointer"
                                    onClick={handleGoogle}
                                >
                                    <FcGoogle className="text-xl" />
                                    Continue with Google
                                </Button>
                                <Button
                                    variant="default"
                                    className="w-full flex items-center bg-black text-white gap-2 justify-center cursor-pointer"
                                    onClick={handleGithub}
                                >
                                    <FaGithub className="text-xl" />
                                    Continue with GitHub
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}