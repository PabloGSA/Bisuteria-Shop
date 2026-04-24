const mongoose = require("mongoose");

const ProductSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "El nombre del producto es obligatorio"],
      trim: true,
    },
    description: {
      type: String,
      required: [true, "La descripción es obligatoria"],
    },
    price: {
      type: Number,
      required: [true, "El precio es obligatorio"],
      min: [0, "El precio no puede ser negativo"],
    },
    image: {
      type: String,
      required: [true, "La imagen es obligatoria"],
    },
    category: {
      type: String,
      enum: ["collares", "pulseras", "aretes", "anillos"],
      required: true,
    },
    stock: {
      type: Number,
      default: 10,
      min: 0,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.models.Product || mongoose.model("Product", ProductSchema);
