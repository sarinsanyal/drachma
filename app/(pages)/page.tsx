"use client"

import HeroPage from "@/components/custom/homepage/Hero";
import { Separator } from "@/components/ui/separator";
import Features from "@/components/custom/homepage/Features";
import Navbar from "@/components/custom/Navbar";
import Use from "@/components/custom/homepage/HowToUse";

export default function Main() {
  return (
    <div className="font-[family-name:var(--font-geist-sans)]">
      <Navbar />
      <HeroPage />
      <Features />
      <Use />
    </div>
  );
}

