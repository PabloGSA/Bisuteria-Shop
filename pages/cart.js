import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useSession } from "next-auth/react";
import { useRouter } from "next/router";
import Layout from "../components/Layout";
import { useCart } from "../context/CartContext";
import toast from "react-hot-toast";

export default function CartPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const { items, removeItem, clearCart, totalItems, totalPrice } = useCart();
  const [loading, setLoading] = useState(false);

  const handleCheckout = async () => {
    if (!session) {
      toast.error("Debes iniciar sesión para pagar");
      router.push("/login?callbackUrl=/cart");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/checkout/create-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message);

      clearCart();
      window.location.href = data.url;
    } catch (error) {
      toast.error(error.message || "Error al procesar el pago");
      setLoading(false);
    }
  };

  // Carrito vacio
  if (items.length === 0) {
    return (
      <Layout>
        <div className="text-center py-32">
          <p className="text-xs uppercase tracking-widest text-gray-400 mb-6">Tu carrito</p>
          <h2 className="text-2xl font-light text-gray-900 mb-4">Tu carrito está vacío</h2>
          <p className="text-gray-400 text-sm mb-10">Explora nuestra colección y agrega algo especial</p>
          <Link
            href="/"
            className="border border-black text-black px-10 py-3 text-sm uppercase tracking-widest hover:bg-black hover:text-white transition"
          >
            Ver colección
          </Link>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>

      {/* Encabezado */}
      <div className="border-b border-gray-200 pb-6 mb-10">
        <p className="text-xs uppercase tracking-widest text-gray-400 mb-1">Romi Antonucci</p>
        <h1 className="text-3xl font-light text-gray-900 tracking-wide">
          Tu carrito <span className="text-gray-400 text-xl">({totalItems} {totalItems === 1 ? "artículo" : "artículos"})</span>
        </h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-16">

        {/* Lista de productos */}
        <div className="lg:col-span-2 space-y-0 divide-y divide-gray-100">
          {items.map((item) => (
            <div key={item._id} className="flex gap-6 py-8">

              {/* Imagen */}
              <div className="relative w-28 h-28 flex-shrink-0 bg-gray-100 overflow-hidden">
                <Image
                  src={item.image}
                  alt={item.name}
                  fill
                  className="object-cover"
                />
              </div>

              {/* Info del producto */}
              <div className="flex-1 flex flex-col justify-between">
                <div>
                  <p className="text-xs uppercase tracking-widest text-gray-400 mb-1">{item.category}</p>
                  <h3 className="text-base font-medium text-gray-900">{item.name}</h3>
                  <p className="text-sm text-gray-500 mt-1">Cantidad: {item.quantity}</p>
                </div>
                <button
                  onClick={() => removeItem(item._id)}
                  className="text-xs uppercase tracking-widest text-gray-400 hover:text-black transition text-left w-fit border-b border-gray-300 hover:border-black pb-0.5"
                >
                  Eliminar
                </button>
              </div>

              {/* Precio */}
              <div className="text-right flex-shrink-0">
                <p className="text-base font-medium text-gray-900">
                  ${(item.price * item.quantity).toFixed(2)}
                </p>
                <p className="text-xs text-gray-400 mt-1">${item.price.toFixed(2)} c/u</p>
              </div>
            </div>
          ))}
        </div>

        {/* Resumen del pedido */}
        <div className="lg:col-span-1">
          <div className="bg-gray-50 p-8 sticky top-6">
            <h2 className="text-sm uppercase tracking-widest text-gray-900 font-semibold mb-6">
              Resumen del pedido
            </h2>

            <div className="space-y-3 text-sm text-gray-600 mb-6">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span>${totalPrice.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>Envío</span>
                <span className="text-gray-900">Gratis</span>
              </div>
            </div>

            <div className="border-t border-gray-200 pt-4 mb-8">
              <div className="flex justify-between text-gray-900 font-medium text-base">
                <span>Total</span>
                <span>${totalPrice.toFixed(2)}</span>
              </div>
            </div>

            <button
              onClick={handleCheckout}
              disabled={loading}
              className="w-full bg-black text-white py-4 text-sm uppercase tracking-widest hover:bg-gray-800 transition disabled:opacity-50"
            >
              {loading ? "Redirigiendo..." : "Proceder al pago"}
            </button>

            <p className="text-xs text-center text-gray-400 mt-4 tracking-wide">
              Pago seguro procesado por Stripe
            </p>

            <div className="mt-6 text-center">
              <Link
                href="/"
                className="text-xs uppercase tracking-widest text-gray-400 hover:text-black transition border-b border-gray-300 hover:border-black pb-0.5"
              >
                Seguir comprando
              </Link>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
