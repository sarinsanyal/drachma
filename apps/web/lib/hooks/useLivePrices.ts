"use client";

import { useEffect, useRef, useState } from "react";
import { io, Socket } from "socket.io-client";

type Candle = {
    symbol: string;
    open: number;
    high: number;
    low: number;
    close: number;
    volume: number;
    bucketStart: number;
};

type Tick = {
    symbol: string;
    price: number;
    timestamp: number;
    volume: number;
};

export function useLivePrices() {
    const [prices, setPrices] = useState<Record<string, Candle>>({});
    const [ticks, setTicks] = useState<Record<string, number>>({}); // symbol -> latest price
    const [connected, setConnected] = useState(false);
    const socketRef = useRef<Socket | null>(null);

    useEffect(() => {
        const socket = io(process.env.NEXT_PUBLIC_SERVER_URL!, {
            transports: ["websocket"],
        });

        socketRef.current = socket;

        socket.on("connect", () => setConnected(true));
        socket.on("disconnect", () => setConnected(false));

        socket.on("price_update", (candle: Candle) => {
            setPrices((prev) => ({ ...prev, [candle.symbol]: candle }));
        });

        // Raw ticks — updates as fast as Finnhub sends them
        socket.on("tick", (tick: Tick) => {
            setTicks((prev) => ({ ...prev, [tick.symbol]: tick.price }));
        });

        return () => { socket.disconnect(); };
    }, []);

    return { prices, ticks, connected };
}