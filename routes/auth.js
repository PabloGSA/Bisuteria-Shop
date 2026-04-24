const express = require("express");
const router = express.Router();
const connectDB = require("../lib/mongodb");
const User = require("../models/User");

// GET /login - muestra el formulario de login
router.get("/login", (req, res) => {
  if (req.session.user) return res.redirect("/");
  const callbackUrl = req.query.callbackUrl || "/";
  const registered = req.query.registered === "1";
  res.render("login", { error: null, callbackUrl, registered });
});

// POST /login - procesa el login
router.post("/login", async (req, res) => {
  const { email, password } = req.body;
  const callbackUrl = req.body.callbackUrl || "/";

  try {
    await connectDB();
    const user = await User.findOne({ email });

    if (!user) {
      return res.render("login", { error: "Email o contraseña incorrectos", callbackUrl });
    }

    const isValid = await user.comparePassword(password);
    if (!isValid) {
      return res.render("login", { error: "Email o contraseña incorrectos", callbackUrl });
    }

    // Guardamos los datos del usuario en la sesión
    req.session.user = {
      id: user._id.toString(),
      name: user.name,
      email: user.email,
      role: user.role,
    };

    res.redirect(callbackUrl);
  } catch (error) {
    console.error(error);
    res.render("login", { error: "Error interno del servidor", callbackUrl });
  }
});

// GET /register - muestra el formulario de registro
router.get("/register", (req, res) => {
  if (req.session.user) return res.redirect("/");
  res.render("register", { error: null });
});

// POST /register - procesa el registro
router.post("/register", async (req, res) => {
  const { name, email, password, confirmPassword } = req.body;

  if (password !== confirmPassword) {
    return res.render("register", { error: "Las contraseñas no coinciden" });
  }

  try {
    await connectDB();

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.render("register", { error: "Ya existe una cuenta con ese email" });
    }

    await User.create({ name, email, password });

    res.redirect("/login?registered=1");
  } catch (error) {
    console.error(error);
    res.render("register", { error: "Error al crear la cuenta" });
  }
});

// GET /logout - cierra la sesión
router.get("/logout", (req, res) => {
  req.session.destroy(() => {
    res.redirect("/");
  });
});

module.exports = router;
