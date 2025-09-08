// import Stripe from "stripe";
// import Transaction from "../models/Transaction.js";
// import User from "../models/User.js";

// export const stripeWebhooks = async (req, res) => {
//   const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
//   const sig = req.headers["stripe-signature"];

//   let event;
//   try {
//     event = stripe.webhooks.constructEvents(
//       req.body,
//       sig,
//       process.env.STRIPE_WEBHOOK_SECRET
//     );
//   } catch (error) {
//     return res.status(400).send(`webhook error : ${error.message}`);
//   }

//   try {
//     switch (event.type) {
//       case "payment_intent.succeeded": {
//         const paymentIntent = event.data.object;
//         const sessionList = await stripe.checkout.sessions.list({
//           payment_intent: paymentIntent.id,
//         });

//         const session = sessionList.data[0];
//         const { transactionId, appId } = session.metadata;

//         if (appId == "chitchat") {
//           const transaction = await Transaction.findOne({
//             _id: transactionId,
//             isPaid: false,
//           });

//           //update credits in user account
//           await User.updateOne(
//             { _id: transaction.userId },
//             { $inc: { credits: transaction.credits } }
//           );

//           //update the credit payment status
//           transaction.isPaid = true;
//           await transaction.save();
//         } else {
//           return res.json({
//             recieved: true,
//             message: "Ignored event: Invalid app",
//           });
//         }
//         break;
//       }
//       default:
//         console.log("Unhandled event type:", event.type);
//         break;
//     }
//     res.json({ received: true });
//   } catch (error) {
//     console.error("Webhook processing error:", error);
//     res.status(500).send("internal server error");
//   }
// };

import Stripe from "stripe";
import Transaction from "../models/Transaction.js";
import User from "../models/User.js";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export const stripeWebhooks = async (req, res) => {
  const sig = req.headers["stripe-signature"];

  let event;
  try {
    event = stripe.webhooks.constructEvents(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (error) {
    console.error("Webhook signature verification failed", error.message);
    return res.status(400).send(`webhook error : ${error.message}`);
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object;

        const { transactionId, appId } = session.metadata || {};

        if (appId == "chitchat") {
          const transaction = await Transaction.findOne({
            _id: transactionId,
            isPaid: false,
          });

          //update credits in user account
          await User.updateOne(
            { _id: transaction.userId },
            { $inc: { credits: transaction.credits } }
          );

          //update the credit payment status
          transaction.isPaid = true;
          await transaction.save();
        } else {
          return res.json({
            recieved: true,
            message: "Ignored event: Invalid app",
          });
        }
        break;
      }
      default:
        console.log("Unhandled event type:", event.type);
        break;
    }
    res.json({ received: true });
  } catch (error) {
    console.error("Webhook processing error:", error);
    res.status(500).send("internal server error");
  }
};
