const express = require("express");
const router = express.Router();
const stripe = require("../lib/stripe");
const connectDB = require("../lib/mongodb");
const Order = require("../models/Order");

// POST /api/webhook - recibe eventos de Stripe
// Nota: el body debe llegar SIN parsear (raw), se configura en server.js
router.post("/", async (req, res) => {
  const signature = req.headers["stripe-signature"];

  let event;

  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (error) {
    console.error("Error al verificar webhook:", error.message);
    return res.status(400).json({ message: "Webhook no válido" });
  }

  if (event.type === "checkout.session.completed") {
    const stripeSession = event.data.object;

    try {
      await connectDB();
      await Order.findOneAndUpdate(
        { stripeSessionId: stripeSession.id },
        { status: "pagado" }
      );
      console.log("Pedido marcado como pagado:", stripeSession.id);
    } catch (error) {
      console.error("Error al actualizar el pedido:", error);
      return res.status(500).json({ message: "Error al actualizar el pedido" });
    }
  }

  res.json({ received: true });
});

module.exports = router;
