"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { AuroraText } from "../magicui/aurora-text";
import { Menu, X } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

export default function Navbar() {
    const [menuOpen, setMenuOpen] = useState(false);
    const [user, setUser] = useState<any>(null);
    const supabase = createClient();
    const router = useRouter();

    useEffect(() => {
        supabase.auth.getUser().then(({ data: { user } }) => setUser(user));
    }, []);

    const handleAuthClick = () => {
        if (user) router.push("/dashboard");
        else router.push("/auth");
    };

    return (
        <nav className="w-full px-6 py-4 font-(family-name:--font-geist-sans) bg-transparent z-50">
            <div className="flex items-center justify-between">
                <div className="font-extrabold text-xl md:text-3xl">
                    <Link href="/">
                        <AuroraText> Drachma</AuroraText>
                    </Link>
                </div>

                <div className="hidden md:flex gap-4 font-bold text-md md:text-lg">
                    <Link href="/#features" className="px-3 text-gray-300 hover:text-white transition-colors duration-250">What is Drachma?</Link>
                    <Link href="/#how-to-use" className="px-3 text-gray-300 hover:text-white transition-colors duration-250">How to use</Link>
                    <Link href="/#reviews" className="px-3 text-gray-300 hover:text-white transition-colors duration-250">Reviews</Link>
                </div>

                <div className="hidden md:block">
                    <button
                        onClick={handleAuthClick}
                        className="cursor-pointer font-bold text-white bg-transparent border-2 border-blue-400 px-5 py-2 hover:bg-gray-500 transition-all duration-300 ease-in-out rounded-lg"
                    >
                        {user ? "Dashboard" : "Sign Up"}
                    </button>
                </div>

                <div className="md:hidden">
                    <button onClick={() => setMenuOpen(!menuOpen)} className="text-white focus:outline-none">
                        {menuOpen ? <X size={24} /> : <Menu size={24} />}
                    </button>
                </div>
            </div>

            {menuOpen && (
                <div className="mt-4 flex flex-col gap-3 md:hidden font-bold">
                    <Link href="/#features" className="px-3 text-gray-300 hover:text-white transition-colors duration-250">What is Drachma?</Link>
                    <Link href="/#how-to-use" className="px-3 text-gray-300 hover:text-white transition-colors duration-250">How to use</Link>
                    <Link href="/#reviews" className="px-3 text-gray-300 hover:text-white transition-colors duration-250">Reviews</Link>
                    <button
                        onClick={handleAuthClick}
                        className="mt-2 text-left font-bold text-white bg-transparent border-2 border-blue-400 px-5 py-2 hover:bg-gray-500 transition"
                    >
                        {user ? "Dashboard" : "Sign Up"}
                    </button>
                </div>
            )}
        </nav>
    );
}