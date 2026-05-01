import "dotenv/config";
import cookieParser from "cookie-parser";
import cors from "cors";
import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import actionItemRoutes from "./routes/actionItemRoutes.js";
import authRoutes from "./routes/authRoutes.js";
import announcementRoutes from "./routes/announcementRoutes.js";
import goalRoutes from "./routes/goalRoutes.js";
import workspaceRoutes from "./routes/workspaceRoutes.js";
import { initSocket } from "./utils/socket.js";

const app = express();
const port = process.env.PORT || 5000;
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: "http://localhost:3000",
    credentials: true,
  },
});

initSocket(io);

app.use(
  cors({
    origin: "http://localhost:3000",
    credentials: true,
  }),
);
app.use(cookieParser());
app.use(express.json());

app.get("/", (req, res) => {
  res.json({ status: "ok" });
});

app.use("/api/auth", authRoutes);
app.use("/api/workspaces", workspaceRoutes);
app.use("/api/workspaces/:workspaceId/goals", goalRoutes);
app.use("/api/workspaces/:workspaceId/announcements", announcementRoutes);
app.use("/api/workspaces/:workspaceId/action-items", actionItemRoutes);

httpServer.listen(port, () => {
  console.log(`API server listening on port ${port}`);
});
