"use client";

import { AuroraText } from "@/components/magicui/aurora-text";
import { motion } from "framer-motion";

const steps = [
    {
        title: "Create an Account",
        description:
            "Sign up for free and instantly get $10,000 virtual currency to start trading in Drachma's realistic stock simulator.",
    },
    {
        title: "Explore the Market",
        description:
            "Dive into a dynamic virtual stock market. Browse company data, check live prices, and analyze trends across sectors.",
    },
    {
        title: "Buy & Sell Stocks",
        description:
            "Place buy or sell orders with a single click. Monitor your positions and respond to market changes instantly.",
    },
    {
        title: "Climb the Leaderboard",
        description:
            "Track your performance, compare with others in real-time, and aim for the top in Drachma’s competitive leaderboard.",
    },
];

export default function Use() {
    return (
        <section
            id="how-to-use"
            className="py-32 relative z-10 bg-gradient-to-b from-[#0a0a1f] to-[#1a103c] animate-gradient"
        >
            <div className="container mx-auto px-4">
                <motion.div
                    className="text-center mb-20"
                    initial={{ opacity: 0, y: 40 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                    viewport={{ once: true }}
                >
                    <h2 className="text-5xl md:text-6xl font-extrabold text-white leading-tight">
                        <AuroraText>How to Use Drachma</AuroraText>
                    </h2>
                    <p className="text-white/70 max-w-3xl mx-auto mt-6 text-lg md:text-xl">
                        Whether you're a beginner or seasoned trader, Drachma helps you learn the markets with a risk-free, interactive experience.
                    </p>
                </motion.div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10">
                    {steps.map((step, index) => (
                        <motion.div
                            key={index}
                            initial={{ opacity: 0, y: 50 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            transition={{
                                duration: 0.7,
                                delay: index * 0.3,
                                ease: "easeOut",
                            }}
                            viewport={{ once: true }}
                            className="bg-[#1a103c]/90 backdrop-blur-md p-10 rounded-3xl border border-white/10 shadow-2xl hover:shadow-blue-500/30 transition-shadow duration-300 cursor-pointer"
                        >
                            <div className="text-gradient text-2xl font-bold mb-3 bg-clip-text bg-gradient-to-r from-[#38bdf8] to-[#818cf8]">
                                Step {index + 1}
                            </div>
                            <h3 className="text-xl font-semibold text-white mb-3 font-founder-grotesk">
                                {step.title}
                            </h3>
                            <p className="text-white/70 text-base md:text-lg font-founder-grotesk leading-relaxed">
                                {step.description}
                            </p>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
}
