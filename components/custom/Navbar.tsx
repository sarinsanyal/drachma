"use client"

import Link from "next/link";
import { AuroraText } from "../magicui/aurora-text";
import { Button } from "../ui/button";
import { ShimmerButton } from "@/components/magicui/shimmer-button";

export default function Navbar() {
    return (
        <nav className="flex items-center justify-between text-sm align-middle p-6 pb-3 border-t-1 font-[family-name:var(--font-geist-sans)]">
            <div className="font-extrabold text-3xl">
                <Link href="/">
                    <AuroraText> Drachma</AuroraText>
                </Link>
            </div>
            <div className="font-bold justify-between text-lg">
                <Link href="/" className="px-5">What is Drachma?</Link>
                <Link href="/" className="px-5">How to use</Link>
                <Link href="/" className="px-5">Reviews</Link>
            </div>
            <div>
                <ShimmerButton className="cursor-pointer font-bold text-white" background="black">
                    Sign Up
                </ShimmerButton>
            </div>
        </nav>
    )
}