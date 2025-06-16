"use client"

import Link from "next/link";

export default function Footer() {
    return (
        <footer className="flex flex-col items-center text-sm align-middle p-6 pb-3 bg-background/5 font-[family-name:var(--font-geist-sans)]">
            <div className="">
                Created with ❤️ by Sarin Sanyal
            </div>
            <div className="mt-2">
                <Link className="hover:underline p-1" href = "/about">About</Link>
                <Link className="hover:underline p-1" target="_blank" href = "https://www.linkedin.com/in/sarinsanyal">Contact</Link>
                <Link className="hover:underline p-1" href = "/privacy-policy">Privacy Policy</Link>
            </div>
        </footer>
    )
}