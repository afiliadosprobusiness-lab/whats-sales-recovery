import { MessageCircle, Play } from "lucide-react";

export function HeroSection(): JSX.Element {
  return (
    <section
      id="hero"
      className="relative flex min-h-screen items-center overflow-hidden px-4 pb-20 pt-36 sm:px-6"
      aria-label="Hero de recuperacion de ventas"
    >
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-purple-900/20 via-transparent to-blue-900/20" />

      <div className="container relative z-10">
        <div className="grid items-center gap-14 lg:grid-cols-2">
          <div className="space-y-9">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/[0.06] px-4 py-2 backdrop-blur-sm shadow-[0_8px_24px_rgba(2,6,23,0.28)]">
              <span className="h-2 w-2 animate-pulse rounded-full bg-green-500" />
              <span className="text-sm text-foreground/80">Automatizacion inteligente de ventas</span>
            </div>

            <h1 className="bg-gradient-to-r from-white via-white to-white/60 bg-clip-text text-5xl font-bold leading-[1.05] text-transparent md:text-7xl">
              Recupera ventas perdidas en WhatsApp automaticamente.
            </h1>

            <p className="max-w-2xl text-xl leading-relaxed text-foreground/70 md:text-2xl">
              Clientes preguntan, desaparecen y nunca vuelven.
              <br />
              RecuperaVentas los trae de vuelta y cierra la venta por ti.
            </p>

            <div className="flex flex-col gap-4 pt-1 sm:flex-row">
              <button className="ui-btn-primary">
                <MessageCircle className="h-5 w-5" />
                Conectar mi WhatsApp
              </button>
              <button className="ui-btn-secondary">
                <Play className="h-5 w-5" />
                Ver demo
              </button>
            </div>

            <div className="flex flex-wrap items-center gap-7 pt-4">
              <div>
                <div className="text-3xl font-bold text-white">+27%</div>
                <div className="text-sm text-foreground/60">mas clientes</div>
              </div>
              <div className="h-12 w-px bg-gradient-to-b from-transparent via-white/20 to-transparent" />
              <div>
                <div className="text-3xl font-bold text-white">+19%</div>
                <div className="text-sm text-foreground/60">mas ventas</div>
              </div>
              <div className="h-12 w-px bg-gradient-to-b from-transparent via-white/20 to-transparent" />
              <div>
                <div className="text-3xl font-bold text-white">24/7</div>
                <div className="text-sm text-foreground/60">automatizado</div>
              </div>
            </div>
          </div>

          <div className="relative">
            <div className="ui-card relative overflow-hidden border-white/20 bg-gradient-to-br from-white/10 to-white/[0.03] p-8 backdrop-blur-xl">
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-white/[0.04] via-transparent to-transparent" />

              <div className="relative flex items-center gap-3 border-b border-white/10 pb-6">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-green-400 to-green-600 shadow-md shadow-green-500/40">
                  <MessageCircle className="h-6 w-6 text-white" />
                </div>
                <div>
                  <div className="font-semibold text-white">Cliente</div>
                  <div className="text-sm text-foreground/60">En linea</div>
                </div>
              </div>

              <div className="relative space-y-4 py-6">
                <div className="flex justify-start">
                  <div className="max-w-[80%] rounded-2xl rounded-tl-sm border border-white/10 bg-white/10 px-4 py-3 backdrop-blur-sm shadow-[0_8px_20px_rgba(2,6,23,0.25)]">
                    <p className="text-white">precio?</p>
                    <span className="mt-1 block text-xs text-foreground/50">14:23</span>
                  </div>
                </div>

                <div className="flex justify-end">
                  <div className="max-w-[80%] rounded-2xl rounded-tr-sm bg-gradient-to-r from-purple-600 to-blue-600 px-4 py-3 shadow-[0_12px_24px_rgba(79,70,229,0.4)]">
                    <p className="text-white">Hola! El precio es S/299</p>
                    <span className="mt-1 block text-xs text-white/70">14:24</span>
                  </div>
                </div>

                <div className="flex justify-center py-4">
                  <div className="flex items-center gap-2 rounded-full border border-red-500/20 bg-red-500/10 px-4 py-2">
                    <span className="h-2 w-2 rounded-full bg-red-500" />
                    <span className="text-sm text-red-400">Cliente desaparecio</span>
                  </div>
                </div>

                <div className="flex justify-end">
                  <div className="relative max-w-[80%] rounded-2xl rounded-tr-sm bg-gradient-to-r from-green-600 to-emerald-600 px-4 py-3 shadow-[0_12px_24px_rgba(16,185,129,0.35)]">
                    <div className="absolute -right-2 -top-2 rounded-full bg-yellow-500 px-2 py-1 text-xs font-semibold text-black shadow-md">
                      AUTO
                    </div>
                    <p className="text-white">Hola, aun te interesa el producto?</p>
                    <span className="mt-1 block text-xs text-white/70">16:30</span>
                  </div>
                </div>

                <div className="flex justify-start">
                  <div className="max-w-[80%] rounded-2xl rounded-tl-sm border border-white/10 bg-white/10 px-4 py-3 backdrop-blur-sm shadow-[0_8px_20px_rgba(2,6,23,0.25)]">
                    <p className="text-white">Si! Lo quiero.</p>
                    <span className="mt-1 block text-xs text-foreground/50">16:45</span>
                  </div>
                </div>
              </div>

              <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-gradient-to-r from-green-500 to-emerald-500 px-6 py-3 shadow-[0_12px_28px_rgba(16,185,129,0.5)]">
                <span className="font-bold text-white">Venta recuperada</span>
              </div>
            </div>

            <div className="pointer-events-none absolute -right-4 -top-4 -z-10 h-72 w-72 rounded-full bg-purple-500/20 blur-3xl" />
            <div className="pointer-events-none absolute -bottom-4 -left-4 -z-10 h-72 w-72 rounded-full bg-blue-500/20 blur-3xl" />
          </div>
        </div>
      </div>
    </section>
  );
}
