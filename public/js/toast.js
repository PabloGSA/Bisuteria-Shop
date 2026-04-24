// ── Notificaciones tipo toast ─────────────────────────────────────────────────

function showToast(message, type = "success") {
  const container = document.getElementById("toast-container");
  if (!container) return;

  const toast = document.createElement("div");

  const colors = {
    success: "bg-gray-900 text-white",
    error: "bg-red-600 text-white",
  };

  toast.className = `px-5 py-3 text-sm shadow-lg transition-all duration-300 opacity-0 translate-y-2 ${colors[type] || colors.success}`;
  toast.textContent = message;

  container.appendChild(toast);

  // Animación de entrada
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      toast.classList.remove("opacity-0", "translate-y-2");
    });
  });

  // Desaparecer después de 3 segundos
  setTimeout(() => {
    toast.classList.add("opacity-0");
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}
