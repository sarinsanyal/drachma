
"use client";
import { useEffect, useState } from "react";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

function generateNextPrice(prevPrice: number) {
  const change = (Math.random() - 0.5) * 2; // Random walk
  return +(prevPrice + change).toFixed(2);
}

function generateTimestamp() {
  const now = new Date();
  return now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

export default function StockChart() {
  const [data, setData] = useState(() => {
    const initial = [];
    let price = 100;
    for (let i = 0; i < 20; i++) {
      price = generateNextPrice(price);
      initial.push({ time: generateTimestamp(), price });
    }
    return initial;
  });

  useEffect(() => {
    const interval = setInterval(() => {
      setData(prev => {
        const newPrice = generateNextPrice(prev[prev.length - 1].price);
        const newPoint = { time: generateTimestamp(), price: newPrice };
        const updated = [...prev.slice(1), newPoint];
        return updated;
      });
    }, 2000); // every 2 seconds
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="w-full h-80 py-10 relative bg-transparent/80 backdrop-blur-xl rounded-xl px-8 shadow-2xl border border-white/10">
      <h2 className="text-white font-bold mb-2 text-lg">Drachma Index</h2>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
          <XAxis dataKey="time" tick={{ fill: "white", fontSize: 12 }} />
          <YAxis domain={['dataMin - 2', 'dataMax + 2']} tick={{ fill: "white", fontSize: 12 }} />
          <Tooltip contentStyle={{ backgroundColor: "#111", border: "none", color: "#fff" }} />
          <Line
            type="monotone"
            dataKey="price"
            stroke="#4ade80"
            strokeWidth={2}
            dot={false}
            isAnimationActive={true}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
