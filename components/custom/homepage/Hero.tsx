"use client";

import { motion, animate } from "framer-motion";
import { useState, useEffect } from "react";
import { AuroraText } from "@/components/magicui/aurora-text";
import StockChart from "./StockChart";
import { InteractiveHoverButton } from "@/components/magicui/interactive-hover-button";

export default function HeroPage() {
    const [companyCount, setCompanyCount] = useState(0);
    const [startingMoney, setStartingMoney] = useState(0);

    useEffect(() => {
        const controls = animate(0, 200, {
            duration: 1.2,
            onUpdate(value) {
                setCompanyCount(Math.floor(value));
            },
        });
        return () => controls.stop();
    }, []);

    useEffect(() => {
        const controls = animate(0, 10000, {
            duration: 1.5,
            onUpdate(value) {
                setStartingMoney(Math.floor(value));
            },
        });
        return () => controls.stop();
    }, []);

    return (
        <section className="min-h-screen flex flex-col md:flex-row justify-between gap-8 p-6 pt-20 text-white font-[family-name:var(--font-geist-sans)]">
            {/* Left Text Block */}
            <div className="w-full md:w-1/2 max-w-4xl">
                <motion.h1
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                    className="text-5xl sm:text-5xl md:text-6xl font-extrabold mb-6"
                >
                    <AuroraText>Mock Stock Trading</AuroraText><br />
                    Right at your fingertips!
                </motion.h1>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3, duration: 0.6 }}
                    className="flex gap-6 mb-10 mt-15"
                >
                    <div>
                        <div className="text-3xl sm:text-4xl font-bold">
                            {companyCount}<AuroraText>+</AuroraText>
                        </div>
                        <div className="font-bold text-gray-400 text-sm">Companies to trade</div>
                    </div>
                    <div>
                        <div className="text-3xl sm:text-4xl font-bold">
                            <AuroraText>$</AuroraText>{startingMoney}
                        </div>
                        <div className="font-bold text-gray-400 text-sm">Instantly to start with!</div>
                    </div>
                </motion.div>

                <motion.p
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6, duration: 0.6 }}
                    className="text-base sm:text-lg text-gray-400 max-w-xl"
                >
                    Simulate real-time stock trading in dynamic markets with live price changes and a $10,000 starting balance. Compete on live leaderboards, test your strategies, and learn the fundamentals of finance in a fun, interactive way!
                </motion.p>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.9, duration: 0.6 }}
                    className="mt-8 flex justify-center sm:justify-start w-full"
                >
                    <InteractiveHoverButton className="text-black text-lg px-6 py-3">
                        Sign Up & Start Trading
                    </InteractiveHoverButton>
                </motion.div>
            </div>

            {/* Right Stock Chart */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6, duration: 0.6 }}
                className="w-full md:w-1/2 bg-rgb(28, 16, 62)">
                <StockChart />
            </motion.div>
        </section>
    );
}
