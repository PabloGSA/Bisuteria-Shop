require("dotenv").config();

const express = require("express");
const session = require("express-session");
const MongoStore = require("connect-mongo");
const path = require("path");
const connectDB = require("./lib/mongodb");
const Product = require("./models/Product");
const Order = require("./models/Order");
const stripe = require("./lib/stripe");
const { requireAuth, requireAdmin } = require("./middleware/auth");

const app = express();
const PORT = process.env.PORT || 3000;

// ── Vistas (EJS) ─────────────────────────────────────────────────────────────
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

// ── Archivos estáticos (imágenes, CSS, JS del cliente) ───────────────────────
app.use(express.static(path.join(__dirname, "public")));

// ── El webhook de Stripe necesita el body RAW (sin parsear) ──────────────────
// Por eso lo registramos ANTES del body parser general
app.use("/api/webhook", express.raw({ type: "application/json" }));

// ── Body parsers ─────────────────────────────────────────────────────────────
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ── Sesiones ─────────────────────────────────────────────────────────────────
app.use(
  session({
    secret: process.env.SESSION_SECRET || "bisuteria-shop-secret-2026",
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({ mongoUrl: process.env.MONGODB_URI }),
    cookie: { maxAge: 1000 * 60 * 60 * 24 * 7 }, // 7 días
  })
);

// ── Variable global para las vistas (acceso fácil a req.session.user en EJS) ─
app.use((req, res, next) => {
  res.locals.user = req.session.user || null;
  next();
});

// ── Rutas API ─────────────────────────────────────────────────────────────────
app.use("/api/products", require("./routes/products"));
app.use("/api/orders", require("./routes/orders"));
app.use("/api/checkout", require("./routes/checkout"));
app.use("/api/webhook", require("./routes/webhook"));

// ── Rutas de autenticación ───────────────────────────────────────────────────
app.use("/", require("./routes/auth"));

// ── Página principal ─────────────────────────────────────────────────────────
app.get("/", async (req, res) => {
  try {
    await connectDB();
    let products = await Product.find({});

    if (products.length === 0) {
      const SAMPLE_PRODUCTS = require("./lib/seedData");
      await Product.insertMany(SAMPLE_PRODUCTS);
      products = await Product.find({});
    }

    const selectedCategory = req.query.cat || "todos";
    res.render("index", { products: JSON.parse(JSON.stringify(products)), selectedCategory });
  } catch (error) {
    console.error(error);
    res.render("index", { products: [], selectedCategory: "todos" });
  }
});

// ── Carrito ──────────────────────────────────────────────────────────────────
app.get("/cart", (req, res) => {
  res.render("cart");
});

// ── Mis pedidos (requiere login) ─────────────────────────────────────────────
app.get("/mis-pedidos", requireAuth, async (req, res) => {
  try {
    await connectDB();
    const orders = await Order.find({ userId: req.session.user.id })
      .sort({ createdAt: -1 })
      .lean();

    const pedidos = orders.map((order) => ({
      id: order._id.toString(),
      items: order.items.map((item) => ({
        name: item.name,
        price: item.price,
        quantity: item.quantity,
      })),
      total: order.total,
      status: order.status,
      createdAt: order.createdAt.toISOString(),
    }));

    res.render("mis-pedidos", { pedidos });
  } catch (error) {
    console.error(error);
    res.render("mis-pedidos", { pedidos: [] });
  }
});

// ── Página de éxito de pago ───────────────────────────────────────────────────
app.get("/success", async (req, res) => {
  const { session_id } = req.query;

  if (!session_id) {
    return res.render("success", { order: null });
  }

  try {
    await connectDB();

    const stripeSession = await stripe.checkout.sessions.retrieve(session_id);

    if (stripeSession.payment_status === "paid") {
      const orderActual = await Order.findOne({ stripeSessionId: session_id });

      if (orderActual && orderActual.status === "pendiente") {
        for (const item of orderActual.items) {
          await Product.findByIdAndUpdate(item.productId, { $inc: { stock: -item.quantity } });
        }
        await Order.findOneAndUpdate({ stripeSessionId: session_id }, { status: "pagado" });
      }
    }

    const order = await Order.findOne({ stripeSessionId: session_id }).lean();

    if (!order) return res.render("success", { order: null });

    res.render("success", {
      order: {
        id: order._id.toString(),
        userEmail: order.userEmail,
        items: order.items,
        total: order.total,
        status: order.status,
        createdAt: order.createdAt.toISOString(),
      },
    });
  } catch (error) {
    console.error(error);
    res.render("success", { order: null });
  }
});

// ── Panel de administración (requiere ser admin) ──────────────────────────────
app.get("/admin/productos", requireAdmin, (req, res) => {
  res.render("admin/productos");
});

// ── Inicio del servidor ───────────────────────────────────────────────────────
app.listen(PORT, async () => {
  await connectDB();
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
