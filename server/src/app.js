import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import http from "http";
import { WebSocketServer } from "ws";
import { randomUUID } from "crypto";
import { partners, send, waitingPool } from "./lib/dataStore.js";

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

const wss = new WebSocketServer({ noServer: true });

wss.on("connection", (ws, req) => {
  ws.id = randomUUID();
  console.log(`new user : ${ws.id} connected to ws server..`);

  // pairing or waiting them
  if (waitingPool.length > 0) {
    const partnerWs = waitingPool.shift();
    if (partnerWs) {
      // pair them up
      partners.set(partnerWs, ws);
      partners.set(ws, partnerWs);

      // notify both users, they find mathced
      send(partnerWs, { type: "matched", initiator: false });
      send(ws, { type: "matched", initiator: true });
    }
  } else {
    // keep ws for waiting
    waitingPool.push(ws);
    send(ws, { type: "waiting" });
  }

  // status of partner-MAP and waiting Pool
  console.log("Map size : ", partners.size);
  console.log("array length : ", waitingPool.length);

  // eventRouter
  ws.on("message", (rawData) => {
    console.log("rawData : ", JSON.parse(rawData));
  });
});

server.on("upgrade", (req, socket, head) => {
  const { pathname } = new URL(req.url, `http://${req.headers.host}`);

  if (pathname === "/ws") {
    wss.handleUpgrade(req, socket, head, (ws) => {
      wss.emit("connection", ws, req);
    });
  } else {
    socket.destroy();
  }
});

app.get("/health", (req, res) => res.json({ status: "ok" }));

export default server;
