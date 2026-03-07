import Link from "next/link";
import { MessageCircle } from "lucide-react";

export function Navbar(): JSX.Element {
  return (
    <header className="fixed inset-x-0 top-0 z-50 px-4 py-3 sm:px-6 sm:py-4">
      <div className="container">
        <div className="flex items-center justify-between gap-2 rounded-2xl border border-white/15 bg-background/75 p-3 shadow-[0_12px_34px_rgba(2,6,23,0.46)] backdrop-blur-xl transition-all duration-300 hover:border-white/25 sm:gap-4 sm:p-4">
          <Link href="/" className="group flex min-w-0 items-center gap-2">
            <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-purple-600 via-indigo-500 to-blue-600 shadow-lg shadow-purple-500/50 transition-transform duration-300 group-hover:scale-105 sm:h-10 sm:w-10">
              <MessageCircle className="h-5 w-5 text-white sm:h-6 sm:w-6" />
            </span>
            <span className="truncate bg-gradient-to-r from-white to-white/80 bg-clip-text text-lg font-bold text-transparent sm:text-xl">
              RecuperaVentas
            </span>
          </Link>

          <nav className="hidden items-center gap-8 md:flex">
            <a href="#solution" className="text-sm text-foreground/70 ui-link-hover">
              Caracteristicas
            </a>
            <a href="#results" className="text-sm text-foreground/70 ui-link-hover">
              Resultados
            </a>
            <a href="#how-it-works" className="text-sm text-foreground/70 ui-link-hover">
              Como funciona
            </a>
          </nav>

          <div className="flex items-center gap-2 sm:gap-4">
            <button className="hidden text-sm text-foreground/70 ui-link-hover sm:block">Iniciar sesion</button>
            <button className="rounded-xl bg-gradient-to-r from-purple-600 via-indigo-500 to-blue-600 px-3 py-2 text-xs font-semibold text-white shadow-[0_10px_28px_rgba(79,70,229,0.42)] transition-all duration-300 hover:scale-[1.03] hover:from-purple-500 hover:to-blue-500 hover:shadow-[0_16px_36px_rgba(79,70,229,0.52)] sm:px-6 sm:py-2.5 sm:text-sm">
              <span className="sm:hidden">Comenzar</span>
              <span className="hidden sm:inline">Comenzar gratis</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
