const { Resend } = require("resend");

const resend = new Resend(process.env.RESEND_API_KEY);

async function enviarEmailConfirmacion({ email, nombre, items, total, orderId }) {
  const listaProductos = items
    .map(
      (item) =>
        `<li style="margin-bottom:6px">${item.name} x${item.quantity} — $${(item.price * item.quantity).toFixed(2)}</li>`
    )
    .join("");

  await resend.emails.send({
    from: "Romi Antonucci Shop <onboarding@resend.dev>",
    to: email,
    subject: "✅ Confirmación de tu pedido — Romi Antonucci Shop",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h1 style="color: #e11d48;">✨ Romi Antonucci Shop</h1>
        <h2>¡Gracias por tu compra, ${nombre}!</h2>
        <p>Tu pedido ha sido confirmado y está siendo preparado.</p>
        <div style="background: #f9f9f9; padding: 16px; border-radius: 8px; margin: 20px 0;">
          <h3 style="margin-top: 0;">Resumen del pedido</h3>
          <ul style="padding-left: 20px;">
            ${listaProductos}
          </ul>
          <p style="font-weight: bold; font-size: 18px; margin-bottom: 0;">
            Total: $${total.toFixed(2)}
          </p>
        </div>
        <p style="color: #6b7280; font-size: 14px;">ID del pedido: ${orderId}</p>
        <p style="color: #6b7280; font-size: 14px;">¡Esperamos que disfrutes tu compra!</p>
      </div>
    `,
  });
}

module.exports = { enviarEmailConfirmacion };
