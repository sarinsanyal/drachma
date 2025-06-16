"use client";

import Link from "next/link";
import { useState } from "react";
import { AuroraText } from "../magicui/aurora-text";
import { Button } from "../ui/button";
import { Menu, X } from "lucide-react"; // You can swap with other icons

export default function Navbar() {
    const [menuOpen, setMenuOpen] = useState(false);

    return (
        <nav className="w-full px-6 py-4 font-[family-name:var(--font-geist-sans)] bg-transparent z-50">
            <div className="flex items-center justify-between">
                {/* Logo */}
                <div className="font-extrabold text-xl md:text-3xl">
                    <Link href="/">
                        <AuroraText> Drachma</AuroraText>
                    </Link>
                </div>

                {/* Desktop Menu */}
                <div className="hidden md:flex gap-4 font-bold text-md md:text-lg">
                    <Link href="/" className="px-3 text-gray-300 hover:text-white transition-colors duration-250">What is Drachma?</Link>
                    <Link href="/" className="px-3 text-gray-300 hover:text-white transition-colors duration-250">How to use</Link>
                    <Link href="/" className="px-3 text-gray-300 hover:text-white transition-colors duration-250">Reviews</Link>
                </div>

                {/* Sign Up Button */}
                <div className="hidden md:block">
                    <Button className="cursor-pointer font-bold text-white bg-transparent border-2 border-blue-400 px-5 py-2 hover:bg-gray-500 transition-all duration-300 ease-in-out">
                        Sign Up
                    </Button>
                </div>

                {/* Mobile Menu Icon */}
                <div className="md:hidden">
                    <button
                        onClick={() => setMenuOpen(!menuOpen)}
                        className="text-white focus:outline-none"
                    >
                        {menuOpen ? <X size={24} /> : <Menu size={24} />}
                    </button>
                </div>
            </div>

            {/* Mobile Menu */}
            {menuOpen && (
                <div className="mt-4 flex flex-col gap-3 md:hidden font-bold">
                    <Link href="/" className="px-3 text-gray-300 hover:text-white transition-colors duration-250">What is Drachma?</Link>
                    <Link href="/" className="px-3 text-gray-300 hover:text-white transition-colors duration-250">How to use</Link>
                    <Link href="/" className="px-3 text-gray-300 hover:text-white transition-colors duration-250">Reviews</Link>
                    <Button className="mt-2 font-bold text-white bg-transparent border-2 border-blue-400 px-5 py-2 hover:bg-gray-500 transition">
                        Sign Up
                    </Button>
                </div>
            )}
        </nav>
    );
}
