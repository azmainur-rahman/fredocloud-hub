import "dotenv/config";
import cookieParser from "cookie-parser";
import cors from "cors";
import express from "express";
import authRoutes from "./routes/authRoutes.js";
import workspaceRoutes from "./routes/workspaceRoutes.js";

const app = express();
const port = process.env.PORT || 5000;

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

app.listen(port, () => {
  console.log(`API server listening on port ${port}`);
});
