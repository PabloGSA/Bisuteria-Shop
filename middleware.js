import { NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";

export async function middleware(req) {
  // getToken lee la cookie de sesión de NextAuth sin necesitar la base de datos
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });

  const { pathname } = req.nextUrl;

  // Si el usuario NO está logueado, lo mandamos al login
  if (!token) {
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("callbackUrl", req.nextUrl.pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Si el usuario está logueado pero NO es admin e intenta entrar a /admin
  if (pathname.startsWith("/admin") && token.role !== "admin") {
    return NextResponse.redirect(new URL("/", req.url));
  }

  // En cualquier otro caso dejamos pasar la petición normalmente
  return NextResponse.next();
}

// Le decimos a Next.js en qué rutas debe ejecutar este middleware
export const config = {
  matcher: ["/mis-pedidos", "/admin/:path*"],
};
