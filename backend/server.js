require("./config/linuxCaseResolver");
require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const morgan = require("morgan");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const mongoSanitize = require("express-mongo-sanitize");

const connectDB = require("./config/db");
const { notFound, errorHandler } = require("./middleware/errorMiddleware");

const authRoutes = require("./routes/authroutes");
const bookRoutes = require("./routes/bookroutes");
const rentalRoutes = require("./routes/rentalroutes");
const recommendationRoutes = require("./routes/recommendationRoutes");
const analyticsRoutes = require("./routes/analyticsRoutes");
const notificationRoutes = require("./routes/notificationRoutes");
const paymentRoutes = require("./routes/paymentRoutes");
const adminEmailRoutes = require("./routes/adminEmailRoutes");
const { handleResendWebhook } = require("./controllers/emailWebhookController");
const emailWorker = require("./services/emailWorker");
const emailScheduler = require("./services/emailScheduler");

const app = express();
app.set("trust proxy", 1);

// --- Security middleware (order matters: these go early, before routes) ---
app.use(helmet({
  crossOriginOpenerPolicy: { policy: "same-origin-allow-popups" },
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));

app.use(express.json({
  verify: (req, res, buf) => {
    req.rawBody = buf.toString();
  }
}));
app.use(express.urlencoded({ extended: true }));

// Strips out any $ or . operators from request data to block NoSQL injection
app.use(mongoSanitize());

// Production CORS Configuration
const allowedOrigins = [
  "http://localhost:3000",
  "http://localhost:5000",
  "http://127.0.0.1:3000",
  "http://127.0.0.1:5000",
  "https://booknexus-lemon.vercel.app",
  "https://booknexus-winterwinty.vercel.app",
  ...(process.env.CLIENT_URL ? process.env.CLIENT_URL.split(",").map(o => o.trim()) : [])
];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    if (
      allowedOrigins.includes(origin) ||
      origin.endsWith(".vercel.app") ||
      (process.env.CLIENT_URL && process.env.CLIENT_URL.includes(origin))
    ) {
      return callback(null, true);
    }
    return callback(null, true);
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"]
}));

if (process.env.NODE_ENV !== "test") app.use(morgan("dev"));

// Health checks — defined BEFORE rate limiters, always return HTTP 200
const healthHandler = (req, res) => {
  const isDbConnected = mongoose.connection.readyState === 1;
  res.status(200).json({
    success: true,
    message: "BookNexus API is running",
    status: "healthy",
    database: isDbConnected ? "connected" : "connecting",
    timestamp: new Date().toISOString(),
    uptime: Math.round(process.uptime()),
    port: parseInt(process.env.PORT, 10) || 5000
  });
};

app.get("/api/health", healthHandler);
app.get("/health", healthHandler);
app.get("/", healthHandler);

// General rate limiter — applies to all API routes
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: process.env.NODE_ENV === "production" ? 200 : 5000,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: "Too many requests, please try again later." },
});
app.use("/api", generalLimiter);

// Auth limiter for login/register
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: process.env.NODE_ENV === "production" ? 15 : 1000,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: "Too many auth attempts, please try again later." },
});
app.use("/api/auth/login", authLimiter);
app.use("/api/auth/register", authLimiter);

app.use("/api/auth", authRoutes);
app.use("/api/books", bookRoutes);
app.use("/api/rentals", rentalRoutes);
app.use("/api/recommendations", recommendationRoutes);
app.use("/api/analytics", analyticsRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/admin/emails", adminEmailRoutes);
app.post("/api/webhooks/resend", handleResendWebhook);

app.use(notFound);
app.use(errorHandler);

const PORT = parseInt(process.env.PORT, 10) || 5000;

const startServer = async () => {
  const server = app.listen(PORT, "0.0.0.0", () => {
    console.log(`BookNexus backend running on port ${PORT} bound to 0.0.0.0`);
  });

  try {
    await connectDB();
    // Start background email processing worker & reminder scheduler
    emailWorker.startEmailWorker();
    emailScheduler.startEmailScheduler();
  } catch (err) {
    console.error("Database connection notice:", err.message);
  }

  const gracefulShutdown = () => {
    console.log("Shutting down BookNexus backend...");
    emailWorker.stopEmailWorker();
    emailScheduler.stopEmailScheduler();
    server.close(() => {
      console.log("HTTP server closed.");
      process.exit(0);
    });
  };

  process.on("SIGINT", gracefulShutdown);
  process.on("SIGTERM", gracefulShutdown);
};

process.on("unhandledRejection", (reason, promise) => {
  console.error("Unhandled Rejection at:", promise, "reason:", reason);
});
process.on("uncaughtException", (err) => {
  console.error("Uncaught Exception thrown:", err);
});

if (require.main === module || !process.env.VERCEL) {
  startServer();
}

module.exports = { app, connectDB };
