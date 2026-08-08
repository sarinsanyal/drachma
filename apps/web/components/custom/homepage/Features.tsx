"use client";

import { AuroraText } from "@/components/magicui/aurora-text";
import { motion } from "framer-motion";

const features = [
  {
    title: "Real-Time Trading Simulation",
    description: "Trade virtual stocks in a dynamic, live environment where prices fluctuate with simulated market forces and news events."
  },
  {
    title: "$10,000 Starting Portfolio",
    description: "Begin your journey with a $10,000 virtual portfolio. Make strategic investments and grow your wealth through smart trading."
  },
  {
    title: "Live Leaderboards",
    description: "Climb the ranks in real-time as you compete with other players. Track your progress, win badges, and dominate the charts."
  },
  {
    title: "Strategy Testing Sandbox",
    description: "Experiment with trading strategies without real-world risks. Learn from your mistakes and optimize your approach."
  },
  {
    title: "Interactive Finance Lessons",
    description: "Learn fundamental financial concepts while you play. From risk management to portfolio diversification, we’ve got you covered."
  },
  {
    title: "Gamified Experience",
    description: "Unlock achievements, complete challenges, and level up as you master the art of investing through engaging gameplay."
  }
];

export default function What() {
  return (
    <section
      id="features"
      className="py-20 md:py-28 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-[#0a0a1f] to-[#1a103c] relative z-10 text-white"
    >
      <div className="max-w-5xl mx-auto text-center">
        <motion.h1
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          viewport={{ once: true }}
          className="text-4xl md:text-5xl font-extrabold tracking-tight mb-6 font-founder-grotesk"
        >
          <AuroraText>What is Drachma?</AuroraText>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.8, ease: "easeOut" }}
          viewport={{ once: true }}
          className="text-white/70 text-sm md:text-base leading-relaxed max-w-3xl mx-auto font-founder-grotesk"
        >
          Drachma is your gateway to financial literacy through immersive simulation. Trade stocks in a dynamic, real-time market environment with live price updates and a $10,000 starting balance.
          Compete on live leaderboards, test diverse investment strategies, and learn the core principles of finance—all in a fun, gamified experience.
        </motion.p>
      </div>

      {/* Feature Cards */}
      <div className="mt-16 max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8 px-2 sm:px-0">
        {features.map((feature, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 + index * 0.1, duration: 0.6, ease: "easeOut" }}
            viewport={{ once: true }}
            className="relative group"
          >
            <div className="absolute -inset-0.5 bg-gradient-to-r from-[#38bdf8]/40 to-[#818cf8]/40 rounded-xl blur opacity-20 group-hover:opacity-100 transition duration-700 group-hover:duration-300"></div>
            <div className="relative bg-[#1a103c]/80 backdrop-blur-xl rounded-xl p-6 md:p-8 shadow-2xl border border-white/10 h-full cursor-pointer">
              <h3 className="text-xl font-bold text-white mb-3 font-founder-grotesk">
                {feature.title}
              </h3>
              <p className="text-white/70 font-founder-grotesk leading-relaxed">
                {feature.description}
              </p>
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
