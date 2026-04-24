const express = require("express");
const router = express.Router();
const connectDB = require("../lib/mongodb");
const Order = require("../models/Order");
const { requireAuthApi } = require("../middleware/auth");

// GET /api/orders - pedidos del usuario actual
router.get("/", requireAuthApi, async (req, res) => {
  try {
    await connectDB();
    const orders = await Order.find({ userId: req.session.user.id }).sort({ createdAt: -1 });
    res.json(orders);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error al obtener los pedidos" });
  }
});

module.exports = router;
