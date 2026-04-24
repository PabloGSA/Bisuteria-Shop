const express = require("express");
const router = express.Router();
const connectDB = require("../lib/mongodb");
const Product = require("../models/Product");
const { requireAdminApi } = require("../middleware/auth");
const SAMPLE_PRODUCTS = require("../lib/seedData");

// GET /api/products - obtener todos los productos
router.get("/", async (req, res) => {
  try {
    await connectDB();
    let products = await Product.find({});

    if (products.length === 0) {
      await Product.insertMany(SAMPLE_PRODUCTS);
      products = await Product.find({});
    }

    res.json(products);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error al obtener productos" });
  }
});

// POST /api/products - crear producto (solo admin)
router.post("/", requireAdminApi, async (req, res) => {
  try {
    await connectDB();
    const { name, description, price, image, category, stock } = req.body;
    const newProduct = await Product.create({ name, description, price, image, category, stock });
    res.status(201).json(newProduct);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error al crear el producto" });
  }
});

// PUT /api/products/:id - actualizar producto (solo admin)
router.put("/:id", requireAdminApi, async (req, res) => {
  try {
    await connectDB();
    const { name, description, price, image, category, stock } = req.body;
    const updated = await Product.findByIdAndUpdate(
      req.params.id,
      { name, description, price, image, category, stock },
      { new: true, runValidators: true }
    );

    if (!updated) return res.status(404).json({ message: "Producto no encontrado" });
    res.json(updated);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error al actualizar el producto" });
  }
});

// DELETE /api/products/:id - eliminar producto (solo admin)
router.delete("/:id", requireAdminApi, async (req, res) => {
  try {
    await connectDB();
    const deleted = await Product.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ message: "Producto no encontrado" });
    res.json({ message: "Producto eliminado correctamente" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error al eliminar el producto" });
  }
});

module.exports = router;
