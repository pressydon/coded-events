import "dotenv/config";
import cors from "cors";
import express from "express";
import { prisma } from "./lib/prisma.js";

const app = express();
const port = Number(process.env.PORT) || 8080;
const host = process.env.HOST || "0.0.0.0";
const allowedOrigins = (process.env.CLIENT_ORIGINS || "http://localhost:5173")
  .split(",")
  .map((origin) => origin.trim());

app.use(cors({ origin: allowedOrigins }));
app.use(express.json());

app.get("/health", (_request, response) => {
  response.json({ status: "ok" });
});

app.get("/health/db", async (_request, response) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    response.json({ status: "ok", database: "connected" });
  } catch (error) {
    console.error("Database health check failed:", error);
    response.status(503).json({ status: "error", database: "unavailable" });
  }
});

app.listen(port, host, () => {
  console.log(`Server listening on ${host}:${port}`);
});
