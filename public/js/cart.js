// ── Gestión del carrito usando localStorage ───────────────────────────────────

function getCart() {
  try {
    return JSON.parse(localStorage.getItem("cart")) || [];
  } catch {
    return [];
  }
}

function saveCart(items) {
  localStorage.setItem("cart", JSON.stringify(items));
  updateCartBadge();
}

function addToCart(product) {
  const items = getCart();
  const existing = items.find((i) => i._id === product._id);

  if (existing) {
    existing.quantity += 1;
  } else {
    items.push({ ...product, quantity: 1 });
  }

  saveCart(items);
  showToast(product.name + " agregado al carrito", "success");
}

function removeFromCart(productId) {
  const items = getCart().filter((i) => i._id !== productId);
  saveCart(items);
  // Si estamos en la página del carrito, re-renderizamos
  if (typeof renderCart === "function") renderCart();
}

function clearCart() {
  localStorage.removeItem("cart");
  updateCartBadge();
}

function updateCartBadge() {
  const items = getCart();
  const total = items.reduce((s, i) => s + i.quantity, 0);
  const badge = document.getElementById("cart-badge");
  if (!badge) return;

  if (total > 0) {
    badge.textContent = total;
    badge.classList.remove("hidden");
    badge.classList.add("flex");
  } else {
    badge.classList.add("hidden");
    badge.classList.remove("flex");
  }
}

// Actualizar badge al cargar cualquier página
updateCartBadge();
