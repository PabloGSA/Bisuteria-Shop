import Navbar from "./Navbar";

export default function Layout({ children }) {
  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      <main className="max-w-7xl mx-auto px-4 py-10">{children}</main>
      <footer className="border-t border-gray-200 mt-16 py-8 text-center text-gray-400 text-sm">
        © 2026 Romi Antonucci — Todos los derechos reservados
        <div className="mt-2">
          Desarrollado por{" "}
          <a
            href="https://github.com/PabloGSA"
            target="_blank"
            rel="noopener noreferrer"
            className="text-pink-400 hover:text-pink-600 transition-colors"
          >
            Pablo Sanchez
          </a>
        </div>
      </footer>
    </div>
  );
}
