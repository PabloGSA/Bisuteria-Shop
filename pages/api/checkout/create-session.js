import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]";
import stripe from "../../../lib/stripe";
import connectDB from "../../../lib/mongodb";
import Order from "../../../models/Order";
import User from "../../../models/User";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Método no permitido" });
  }

  // Verificamos que el usuario esté logueado
  const session = await getServerSession(req, res, authOptions);
  if (!session) {
    return res.status(401).json({ message: "Debes iniciar sesión para comprar" });
  }

  try {
    const { items } = req.body;

    if (!items || items.length === 0) {
      return res.status(400).json({ message: "El carrito está vacío" });
    }

    // Calculamos el total del pedido
    const total = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

    await connectDB();

    // En producción puede pasar que la sesión no incluya user.id (token viejo o cookie desactualizada).
    // En ese caso recuperamos el usuario por email para poder crear la orden.
    let userId = session?.user?.id;
    if (!userId && session?.user?.email) {
      const userDoc = await User.findOne({ email: session.user.email }).select("_id").lean();
      userId = userDoc?._id?.toString();
    }

    if (!userId) {
      return res.status(401).json({
        message: "Sesión inválida. Cierra sesión y vuelve a iniciar para pagar.",
      });
    }

    const appUrl = (process.env.NEXTAUTH_URL || req.headers.origin || "").replace(/\/$/, "");
    if (!appUrl) {
      return res.status(500).json({ message: "Falta configurar NEXTAUTH_URL en el servidor" });
    }

    // Stripe trabaja en centavos, multiplicamos el precio por 100
    const lineItems = items.map((item) => {
      // Stripe exige URLs absolutas para imágenes.
      // Si la imagen viene como ruta relativa ("/images/..."), la convertimos a absoluta.
      // Si no se puede convertir, enviamos el producto sin imagen para no bloquear el checkout.
      const imageUrl = typeof item.image === "string" ? item.image : "";
      const resolvedImage = imageUrl.startsWith("http")
        ? imageUrl
        : imageUrl.startsWith("/")
          ? `${appUrl}${imageUrl}`
          : "";

      return {
        price_data: {
          currency: "usd",
          product_data: {
            name: item.name,
            ...(resolvedImage ? { images: [resolvedImage] } : {}),
          },
          unit_amount: Math.round(item.price * 100),
        },
        quantity: item.quantity,
      };
    });

    // Primero creamos la sesión en Stripe para obtener su ID
    const checkoutSession = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: lineItems,
      mode: "payment",
      success_url: `${appUrl}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${appUrl}/cart`,
      customer_email: session.user.email,
    });

    // Luego guardamos el pedido en MongoDB con el ID de Stripe
    await Order.create({
      userId,
      userEmail: session.user.email,
      items: items.map((item) => ({
        productId: item._id,
        name: item.name,
        price: item.price,
        quantity: item.quantity,
        image: item.image,
      })),
      total: Math.round(total * 100) / 100,
      status: "pendiente",
      stripeSessionId: checkoutSession.id,
    });

    // Devolvemos la URL de Stripe para redirigir al usuario
    return res.status(200).json({ url: checkoutSession.url });
  } catch (error) {
    console.error("Error creando checkout de Stripe:", error);
    return res.status(500).json({
      message: error?.message || "Error al procesar el pago",
    });
  }
}
