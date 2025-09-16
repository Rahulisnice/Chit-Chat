import Stripe from "stripe";
import Transaction from "../models/Transaction.js";
import User from "../models/User.js";

export const stripeWebhooks = async (req, res) => {
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
  const sig = req.headers["stripe-signature"];

  let event;
  try {
    // Ensure we have the raw body for signature verification
    event = stripe.webhooks.constructEvent(
      req.body, // raw body buffer here
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    console.error("❌ Webhook signature verification failed:", err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  try {
    // handle relevant events
    if (event.type === "checkout.session.completed") {
      const session = event.data.object;

      // Check payment status
      if (session.payment_status !== "paid") {
        return res.json({ received: true });
      }

      const transactionId = session.metadata?.transactionId;
      if (!transactionId) {
        console.error("❌ No transactionId in session metadata", session.id);
        return res.status(400).json({ error: "No transaction ID found" });
      }

      // find transaction
      const transaction = await Transaction.findById(transactionId);
      if (!transaction) {
        console.error("❌ Transaction not found:", transactionId);
        return res.status(404).json({ error: "Transaction not found" });
      }

      // idempotent update: only update if not paid
      if (transaction.isPaid) {
        return res.json({ received: true });
      }

      // Update transaction and user in a more robust way
      transaction.isPaid = true;
      await transaction.save();

      const creditsToAdd = transaction.credits || 0;

      // More robust user update with error handling
      const userUpdateResult = await User.findByIdAndUpdate(
        transaction.userId,
        { $inc: { credits: creditsToAdd } },
        { new: true } // Return updated document
      );

      if (!userUpdateResult) {
        console.error("❌ Failed to update user:", transaction.userId);
        // Rollback transaction
        transaction.isPaid = false;
        await transaction.save();
        return res.status(500).json({ error: "Failed to update user credits" });
      }
    } else {
      console.log("ℹ️ Unhandled event type:", event.type);
    }

    res.json({ received: true });
  } catch (error) {
    console.error("❌ Error processing webhook event:", error);
    console.error("Error stack:", error.stack);
    res.status(500).json({
      error: "Internal server error",
      message: error.message,
    });
  }
};
