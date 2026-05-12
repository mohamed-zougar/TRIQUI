require("dotenv").config();
const express = require("express");
const cors = require("cors");

const authRoutes = require("./routes/authRoutes");
const postRoutes = require("./routes/postRoutes");
const storageRoutes = require("./routes/storageRoutes");
const adminRoutes = require("./routes/adminRoutes");
const errorHandler = require("./middleware/errorHandler");

const app = express();

const DEFAULT_DEV_ORIGINS = "http://localhost:3000,http://127.0.0.1:3000";
const allowedOrigins = (process.env.CORS_ORIGIN || DEFAULT_DEV_ORIGINS)
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

app.use(express.json({ limit: "5mb" }));
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow all origins in development (localhost + network IPs)
      if (!origin || allowedOrigins.includes(origin) || origin?.includes("localhost") || origin?.includes("127.0.0.1")) {
        return callback(null, true);
      }
      // In production, check CORS_ORIGIN env variable
      if (process.env.NODE_ENV === "production" && !allowedOrigins.includes(origin)) {
        return callback(new Error("Origin not allowed by CORS policy"));
      }
      return callback(null, true);
    },
    credentials: true,
  })
);

app.get("/api/health", (_req, res) => {
  res.status(200).json({ status: "ok" });
});

app.use("/api/auth", authRoutes);
app.use("/api/posts", postRoutes);
app.use("/api/storage", storageRoutes);
app.use("/api/admin", adminRoutes);

app.use((req, res) => {
  res.status(404).json({ message: "Route not found." });
});

app.use(errorHandler);

const PORT = Number(process.env.PORT) || 5000;

app.listen(PORT, "0.0.0.0", () => {
  console.log(`TriQI+ API listening on http://0.0.0.0:${PORT}`);
  console.log(`Access locally: http://localhost:${PORT}`);
});
