const express = require("express");
const router = express.Router();
const stripe = require("../lib/stripe");
const connectDB = require("../lib/mongodb");
const Order = require("../models/Order");
const { requireAuthApi } = require("../middleware/auth");

// POST /api/checkout/create-session - crea sesión de pago en Stripe
router.post("/create-session", requireAuthApi, async (req, res) => {
  try {
    const { items } = req.body;

    if (!items || items.length === 0) {
      return res.status(400).json({ message: "El carrito está vacío" });
    }

    const total = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

    await connectDB();

    const appUrl = process.env.APP_URL || `http://localhost:${process.env.PORT || 3000}`;

    const lineItems = items.map((item) => {
      const imageUrl = typeof item.image === "string" ? item.image : "";
      const resolvedImage = imageUrl.startsWith("http")
        ? imageUrl
        : imageUrl.startsWith("/")
        ? `${appUrl}${imageUrl}`
        : "";

      return {
        price_data: {
          currency: "usd",
          product_data: {
            name: item.name,
            ...(resolvedImage ? { images: [resolvedImage] } : {}),
          },
          unit_amount: Math.round(item.price * 100),
        },
        quantity: item.quantity,
      };
    });

    const checkoutSession = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: lineItems,
      mode: "payment",
      success_url: `${appUrl}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${appUrl}/cart`,
      customer_email: req.session.user.email,
    });

    await Order.create({
      userId: req.session.user.id,
      userEmail: req.session.user.email,
      items: items.map((item) => ({
        productId: item._id,
        name: item.name,
        price: item.price,
        quantity: item.quantity,
        image: item.image,
      })),
      total: Math.round(total * 100) / 100,
      status: "pendiente",
      stripeSessionId: checkoutSession.id,
    });

    res.json({ url: checkoutSession.url });
  } catch (error) {
    console.error("Error creando checkout de Stripe:", error);
    res.status(500).json({ message: error?.message || "Error al procesar el pago" });
  }
});

module.exports = router;
