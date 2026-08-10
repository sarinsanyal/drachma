import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import cors from "cors";
import dotenv from "dotenv";
import { connectFinnhub } from "./lib/finnhub";

import quotesRouter from "./routes/quotes";
import { warmQuoteCache } from "./routes/quotes";
import tradeRouter from "./routes/trade";

dotenv.config();

const app = express();
app.use(cors({ origin: process.env.CLIENT_ORIGIN || "*" }));
app.use(express.json());

const httpServer = createServer(app);
const io = new Server(httpServer, {
    cors: { origin: process.env.CLIENT_ORIGIN || "*" },
});

app.get("/health", (_req, res) => {
    res.json({ status: "ok", timestamp: Date.now() });
});

app.use("/quotes", quotesRouter);
app.use("/api/trade", tradeRouter);

io.on("connection", (socket) => {
    console.log("[socket.io] Client connected:", socket.id);
    socket.on("disconnect", () => {
        console.log("[socket.io] Client disconnected:", socket.id);
    });
});

async function start() {
    console.log("[server] Warming quote cache...");
    await warmQuoteCache();
    console.log("[server] Quote cache warm — starting server");

    connectFinnhub(
        (candle) => {
            io.emit("price_update", candle);
        },
        (tick) => {
            io.emit("tick", tick); // raw tick, fires on every trade
        }
    );

    setInterval(warmQuoteCache, 60_000);

    const PORT = process.env.PORT || 4000;
    httpServer.listen(PORT, () => {
        console.log(`[server] Listening on port ${PORT}`);
    });
}

start();