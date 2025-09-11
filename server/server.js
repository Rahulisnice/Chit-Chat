// import express from "express";
// import "dotenv/config";
// import cors from "cors";
// import connectDb from "./config/connectDb.js";
// import userRouter from "./routes/userRoutes.js";
// import chatRouter from "./routes/ChatRoutes.js";
// import messageRouter from "./routes/MessageRoutes.js";
// import creditRouter from "./routes/creditRoutes.js";
// import { stripeWebhooks } from "./controllers/webhooks.js";

// await connectDb();
// const app = express();

// app.use((req, res, next) => {
//   console.log("➡️ Incoming request:", req.method, req.url);
//   next();
// });

// //stripe webhooks
// app.post(
//   "/api/stripe",
//   express.raw({ type: "application/json" }),
//   stripeWebhooks
// );

// //middleware
// app.use(cors());
// app.use(express.json());

// //routes
// app.get("/", (req, res) => res.send("server is live"));
// app.use("/api/user", userRouter);
// app.use("/api/chat", chatRouter);
// app.use("/api/message", messageRouter);
// app.use("/api/credit", creditRouter);

// const PORT = process.env.PORT || 3000;

// app.listen(PORT, () => {
//   console.log(`port run successfully on: http://localhost:${PORT}`);
// });
import express from "express";
import "dotenv/config";
import cors from "cors";
import connectDb from "./config/connectDb.js";
import userRouter from "./routes/userRoutes.js";
import chatRouter from "./routes/ChatRoutes.js";
import messageRouter from "./routes/MessageRoutes.js";
import creditRouter from "./routes/creditRoutes.js";
import { stripeWebhooks } from "./controllers/webhooks.js";

await connectDb();
const app = express();

app.use((req, res, next) => {
  console.log("➡️ Incoming request:", req.method, req.url);
  next();
});

// IMPORTANT: Stripe webhook MUST be before express.json() middleware
app.post(
  "/api/stripe",
  express.raw({
    type: "application/json",
    limit: "10mb", // Increase limit if needed
  }),
  stripeWebhooks
);

// Regular middleware (after webhook route)
app.use(
  cors({
    origin: process.env.FRONTEND_URL || "*", // Be more specific in production
    credentials: true,
  })
);
app.use(express.json({ limit: "10mb" }));

// Health check route
app.get("/", (req, res) =>
  res.json({
    message: "Server is live",
    timestamp: new Date().toISOString(),
    env: process.env.NODE_ENV || "development",
  })
);

// API routes
app.use("/api/user", userRouter);
app.use("/api/chat", chatRouter);
app.use("/api/message", messageRouter);
app.use("/api/credit", creditRouter);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error("Unhandled error:", err);
  res.status(500).json({
    error: "Internal server error",
    message:
      process.env.NODE_ENV === "development"
        ? err.message
        : "Something went wrong",
  });
});

// 404 handler - use this syntax instead
app.use((req, res) => {
  res.status(404).json({ error: "Route not found", path: req.path });
});

const PORT = process.env.PORT || 3000;

// Export for Vercel
export default app;

// Only listen if not in Vercel environment
if (process.env.NODE_ENV !== "production") {
  app.listen(PORT, () => {
    console.log(`🚀 Server running on: http://localhost:${PORT}`);
  });
}
