import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import http from "http";

dotenv.config();

const app = express();

app.use(
  cors({
    origin: process.env.FRONTEND_URL,
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  }),
);

app.use(express.json({ limit: "60kb" }));
app.use(express.urlencoded({ extended: true, limit: "60kb" }));
app.use(express.static("public"));

const server = http.createServer(app);

app.get("/health", (req, res) => res.json({ status: "ok" }));

export default server;
