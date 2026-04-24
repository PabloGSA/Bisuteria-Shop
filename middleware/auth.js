// Verifica que el usuario tiene sesión iniciada
function requireAuth(req, res, next) {
  if (!req.session || !req.session.user) {
    return res.redirect("/login?callbackUrl=" + encodeURIComponent(req.originalUrl));
  }
  next();
}

// Verifica que el usuario es administrador
function requireAdmin(req, res, next) {
  if (!req.session || !req.session.user) {
    return res.redirect("/login");
  }
  if (req.session.user.role !== "admin") {
    return res.redirect("/");
  }
  next();
}

// Verifica sesión para rutas de API (devuelve JSON en vez de redirigir)
function requireAuthApi(req, res, next) {
  if (!req.session || !req.session.user) {
    return res.status(401).json({ message: "Debes iniciar sesión" });
  }
  next();
}

// Verifica que es admin para rutas de API (devuelve JSON en vez de redirigir)
function requireAdminApi(req, res, next) {
  if (!req.session || !req.session.user) {
    return res.status(401).json({ message: "Debes iniciar sesión" });
  }
  if (req.session.user.role !== "admin") {
    return res.status(403).json({ message: "Acceso denegado" });
  }
  next();
}

module.exports = { requireAuth, requireAdmin, requireAuthApi, requireAdminApi };
