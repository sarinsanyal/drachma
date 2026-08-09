"use client";

import { useEffect, useRef } from "react";
import {
  createChart,
  ColorType,
  CrosshairMode,
  CandlestickSeries,
  type IChartApi,
  type ISeriesApi,
  type CandlestickData,
  type Time,
} from "lightweight-charts";

function generateCandles(count: number): CandlestickData[] {
  const candles: CandlestickData[] = [];
  let price = 142;
  // Floor to 5-minute boundaries to maintain strict intervals
  const now = Math.floor(Date.now() / 1000 / 300) * 300;

  for (let i = count; i >= 0; i--) {
    const open = +(price + (Math.random() - 0.5) * 2).toFixed(2);
    const close = +(open + (Math.random() - 0.5) * 3).toFixed(2);
    const high = +(Math.max(open, close) + Math.random() * 1.5).toFixed(2);
    const low = +(Math.min(open, close) - Math.random() * 1.5).toFixed(2);
    price = close;

    candles.push({
      time: (now - i * 300) as Time,
      open,
      high,
      low,
      close,
    });
  }

  return candles;
}

export default function StockChart() {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const seriesRef = useRef<ISeriesApi<"Candlestick"> | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    // Initialize Chart
    const chart = createChart(containerRef.current, {
      width: containerRef.current.clientWidth,
      height: containerRef.current.clientHeight || 288,
      layout: {
        background: { type: ColorType.Solid, color: "transparent" },
        textColor: "rgba(255,255,255,0.5)",
        fontFamily: "inherit",
      },
      grid: {
        vertLines: { color: "rgba(255,255,255,0.04)" },
        horzLines: { color: "rgba(255,255,255,0.04)" },
      },
      crosshair: {
        mode: CrosshairMode.Normal,
        vertLine: { color: "rgba(255,255,255,0.2)", labelBackgroundColor: "#2d2d2d" },
        horzLine: { color: "rgba(255,255,255,0.2)", labelBackgroundColor: "#2d2d2d" },
      },
      rightPriceScale: {
        borderColor: "rgba(255,255,255,0.08)",
      },
      timeScale: {
        borderColor: "rgba(255,255,255,0.08)",
        timeVisible: true,
        secondsVisible: false,
      },
      handleScroll: true,
      handleScale: true,
    });

    chartRef.current = chart;

    // Use standard addSeries syntax
    const series = chart.addSeries(CandlestickSeries, {
      upColor: "#22c55e",
      downColor: "#ef4444",
      borderUpColor: "#22c55e",
      borderDownColor: "#ef4444",
      wickUpColor: "#22c55e",
      wickDownColor: "#ef4444",
    });

    seriesRef.current = series;

    const initialData = generateCandles(80);
    series.setData(initialData);
    chart.timeScale().fitContent();

    // Handle container resizing cleanly
    const ro = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        chart.applyOptions({ width, height });
      }
    });
    ro.observe(containerRef.current);

    // Simulate live candle updates
    let lastCandle = initialData[initialData.length - 1];
    const interval = setInterval(() => {
      const open = lastCandle.close;
      const close = +(open + (Math.random() - 0.5) * 3).toFixed(2);
      const high = +(Math.max(open, close) + Math.random() * 1.5).toFixed(2);
      const low = +(Math.min(open, close) - Math.random() * 1.5).toFixed(2);
      const time = ((lastCandle.time as number) + 300) as Time;

      const newCandle: CandlestickData = { time, open, high, low, close };
      series.update(newCandle);
      lastCandle = newCandle;
    }, 2000);

    return () => {
      clearInterval(interval);
      ro.disconnect();
      chart.remove();
    };
  }, []);

  return (
    <div className="w-full py-6 px-6 bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 shadow-2xl">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-white font-bold text-lg">Drachma Index</h2>
          <p className="text-white/40 text-xs mt-0.5">Candle Stick</p>
        </div>
      </div>
      <div ref={containerRef} className="w-full h-72" />
    </div>
  );
}