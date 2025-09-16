import Transaction from "../models/Transaction.js";
import Stripe from "stripe";

const plans = [
  {
    _id: "basic",
    name: "Basic",
    price: 200,
    credits: 100,
    features: [
      "100 text generations",
      "50 image generations",
      "Standard support",
      "Access to basic models",
    ],
  },
  {
    _id: "pro",
    name: "Pro",
    price: 1000,
    credits: 500,
    features: [
      "500 text generations",
      "200 image generations",
      "Priority support",
      "Access to pro models",
      "Faster response time",
    ],
  },
  {
    _id: "premium",
    name: "Premium",
    price: 2000,
    credits: 1000,
    features: [
      "1000 text generations",
      "500 image generations",
      "24/7 VIP support",
      "Access to premium models",
      "Dedicated account manager",
    ],
  },
];

//api controller for getting all plans
export const getPlans = async (req, res) => {
  try {
    res.json({ success: true, plans });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};

// stripe instance
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

//api controller for purchasing a plan
export const purchasePlan = async (req, res) => {
  // disable the purhase feature
  if (process.env.FEATURE_CREDIT_PURCHASE === "off") {
    return res.json({
      success: false,
      message: "Purchase feature is blocked by host for demo.",
    });
  }

  try {
    const { planId } = req.body;
    const userId = req.user._id;
    const plan = plans.find((plan) => plan._id === planId);

    if (!plan) {
      return res.json({ success: false, message: "invalid plan" });
    }

    //create new transaction
    const transaction = await Transaction.create({
      userId: userId,
      planId: plan._id,
      amount: plan.price,
      credits: plan.credits,
      isPaid: false,
    });

    const { origin } = req.headers;
    const session = await stripe.checkout.sessions.create({
      line_items: [
        {
          price_data: {
            currency: "inr",
            unit_amount: plan.price * 100,
            product_data: {
              name: plan.name,
            },
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      success_url: `${origin}/loading`,
      cancel_url: `${origin}/`,
      metadata: {
        transactionId: transaction._id.toString(),
        appId: "chitchat",
      },

      expires_at: Math.floor(Date.now() / 1000) + 30 * 60, //expires in 30 min
    });

    res.json({ success: true, url: session.url });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};
