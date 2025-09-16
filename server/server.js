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

//stripe webhooks
app.post(
  "/api/stripe",
  express.raw({ type: "application/json" }),
  stripeWebhooks
);

//middleware
app.use(cors());
app.use(express.json());

//routes
app.get("/", (req, res) => res.send("server is live"));
app.use("/api/user", userRouter);
app.use("/api/chat", chatRouter);
app.use("/api/message", messageRouter);
app.use("/api/credit", creditRouter);

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`port run successfully on: http://localhost:${PORT}`);
});
