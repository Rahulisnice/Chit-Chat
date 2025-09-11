// import Stripe from "stripe";
// import Transaction from "../models/Transaction.js";
// import User from "../models/User.js";

// export const stripeWebhooks = async (req, res) => {
//   console.log("✅ Webhook hit, headers:", req.headers);
//   const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
//   const sig = req.headers["stripe-signature"];

//   let event;
//   try {
//     event = stripe.webhooks.constructEvent(
//       req.body,
//       sig,
//       process.env.STRIPE_WEBHOOK_SECRET
//     );
//     console.log("✅ Event received:", event.type);
//   } catch (err) {
//     console.error("Webhook signature verification failed:", err.message);
//     return res.status(400).send(`Webhook Error: ${err.message}`);
//   }

//   try {
//     // handle relevant events
//     if (event.type === "checkout.session.completed") {
//       const session = event.data.object;

//       // Optional: ensure payment actually succeeded
//       if (session.payment_status && session.payment_status !== "paid") {
//         console.log(
//           "session payment_status not paid yet:",
//           session.payment_status
//         );
//         return res.json({ received: true }); // don't mark unpaid session
//       }

//       const transactionId = session.metadata?.transactionId;
//       if (!transactionId) {
//         console.error("No transactionId in session metadata", session.id);
//         return res.json({ received: true });
//       }

//       // find transaction
//       const transaction = await Transaction.findById(transactionId);
//       if (!transaction) {
//         console.error("Transaction not found:", transactionId);
//         return res.json({ received: true });
//       }

//       // idempotent update: only update if not paid
//       if (transaction.isPaid) {
//         console.log("Transaction already processed:", transactionId);
//         return res.json({ received: true });
//       }

//       // mark transaction paid
//       transaction.isPaid = true;
//       await transaction.save();

//       // increment user credits atomically
//       await User.findByIdAndUpdate(transaction.userId, {
//         $inc: { credits: transaction.credits || 0 },
//       });

//       console.log("Transaction processed and user credited:", transactionId);
//     } else {
//       console.log("Unhandled event type:", event.type);
//     }

//     res.json({ received: true });
//   } catch (error) {
//     console.error("Error processing webhook event:", error);
//     res.status(500).send("Internal server error");
//   }
// };

import Stripe from "stripe";
import Transaction from "../models/Transaction.js";
import User from "../models/User.js";

export const stripeWebhooks = async (req, res) => {
  console.log("✅ Webhook hit, headers:", req.headers);
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
  const sig = req.headers["stripe-signature"];

  let event;
  try {
    event = stripe.webhooks.constructEvent(
      Buffer.isBuffer(req.body) ? req.body : Buffer.from(req.body), // ← ONLY CHANGE HERE
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
    console.log("✅ Event received:", event.type);
  } catch (err) {
    console.error("Webhook signature verification failed:", err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  try {
    // handle relevant events
    if (event.type === "checkout.session.completed") {
      const session = event.data.object;

      // Optional: ensure payment actually succeeded
      if (session.payment_status && session.payment_status !== "paid") {
        console.log(
          "session payment_status not paid yet:",
          session.payment_status
        );
        return res.json({ received: true }); // don't mark unpaid session
      }

      const transactionId = session.metadata?.transactionId;
      if (!transactionId) {
        console.error("No transactionId in session metadata", session.id);
        return res.json({ received: true });
      }

      // find transaction
      const transaction = await Transaction.findById(transactionId);
      if (!transaction) {
        console.error("Transaction not found:", transactionId);
        return res.json({ received: true });
      }

      // idempotent update: only update if not paid
      if (transaction.isPaid) {
        console.log("Transaction already processed:", transactionId);
        return res.json({ received: true });
      }

      // mark transaction paid
      transaction.isPaid = true;
      await transaction.save();

      // increment user credits atomically
      await User.findByIdAndUpdate(transaction.userId, {
        $inc: { credits: transaction.credits || 0 },
      });

      console.log("Transaction processed and user credited:", transactionId);
    } else {
      console.log("Unhandled event type:", event.type);
    }

    res.json({ received: true });
  } catch (error) {
    console.error("Error processing webhook event:", error);
    res.status(500).send("Internal server error");
  }
};
