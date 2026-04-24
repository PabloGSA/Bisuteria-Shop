const mongoose = require("mongoose");

const OrderSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    userEmail: {
      type: String,
      required: true,
    },
    items: [
      {
        productId: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },
        name: { type: String, required: true },
        price: { type: Number, required: true },
        quantity: { type: Number, required: true },
        image: { type: String },
      },
    ],
    total: {
      type: Number,
      required: true,
    },
    status: {
      type: String,
      enum: ["pendiente", "pagado", "cancelado"],
      default: "pendiente",
    },
    stripeSessionId: {
      type: String,
      required: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.models.Order || mongoose.model("Order", OrderSchema);
