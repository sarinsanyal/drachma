"use client"

import { Button } from "../components/ui/button";
import { ArrowRight } from "lucide-react";
import { motion } from "framer-motion";

export default function HeroPage() {
  return (
    <section className="min-h-screen bg-gradient-to-b from-white to-slate-100 flex items-center justify-center p-6">
      <div className="max-w-4xl text-center">
        <motion.h1
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-5xl md:text-6xl font-extrabold text-gray-900"
        >
          Welcome to <span className="text-blue-600">Drachma</span>
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.6 }}
          className="mt-6 text-lg text-gray-600 max-w-2xl mx-auto"
        >
          Simulate real-time stock trading with dynamic markets, live leaderboards,
          and a $10,000 starting balance. Learn finance, compete, and have fun.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.6 }}
          className="mt-8 flex justify-center gap-4"
        >
          <Button className="text-base cursor-pointer px-6 py-3">
            Get Started <ArrowRight className="ml-2 w-4 h-4" />
          </Button>
          <Button variant="outline" className="text-base cursor-pointer px-6 py-3">
            Learn More
          </Button>
        </motion.div>
      </div>
    </section>
  );
}
