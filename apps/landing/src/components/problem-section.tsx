import { TrendingDown, Users, XCircle } from "lucide-react";

export function ProblemSection(): JSX.Element {
  return (
    <section id="problem" className="relative overflow-hidden px-4 py-32 sm:px-6">
      <div className="container relative z-10">
        <div className="mx-auto mb-20 max-w-4xl text-center">
          <h2 className="mb-6 bg-gradient-to-r from-red-400 via-orange-400 to-red-400 bg-clip-text text-4xl font-bold text-transparent md:text-6xl">
            El 80% de los clientes que preguntan por WhatsApp nunca compran.
          </h2>
          <p className="mx-auto max-w-3xl text-xl leading-relaxed text-foreground/60">
            Miles de ventas se pierden cada dia por falta de seguimiento
          </p>
        </div>

        <div className="mx-auto max-w-4xl">
          <div className="relative grid gap-7">
            <div className="ui-card border-white/20 bg-gradient-to-br from-blue-500/20 to-purple-500/20 p-8">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 shadow-lg shadow-blue-500/45">
                    <Users className="h-8 w-8 text-white" />
                  </div>
                  <div>
                    <div className="mb-1 text-5xl font-bold text-white">100</div>
                    <div className="text-lg text-foreground/70">Clientes preguntan</div>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-center">
              <div className="relative h-16 w-1 bg-gradient-to-b from-blue-500 to-red-500">
                <div className="absolute bottom-0 left-1/2 h-0 w-0 -translate-x-1/2 border-l-8 border-r-8 border-t-8 border-l-transparent border-r-transparent border-t-red-500" />
              </div>
            </div>

            <div className="ui-card border-red-500/30 bg-gradient-to-br from-red-500/20 to-orange-500/20 p-8">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-red-500 to-red-600 shadow-lg shadow-red-500/45">
                    <XCircle className="h-8 w-8 text-white" />
                  </div>
                  <div>
                    <div className="mb-1 text-5xl font-bold text-red-400">80</div>
                    <div className="text-lg text-foreground/70">Desaparecen sin comprar</div>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-center">
              <div className="relative h-16 w-1 bg-gradient-to-b from-red-500 to-gray-500">
                <div className="absolute bottom-0 left-1/2 h-0 w-0 -translate-x-1/2 border-l-8 border-r-8 border-t-8 border-l-transparent border-r-transparent border-t-gray-500" />
              </div>
            </div>

            <div className="ui-card border-white/10 bg-gradient-to-br from-gray-800/50 to-gray-900/50 p-8">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-gray-600 to-gray-700 shadow-lg shadow-gray-700/40">
                    <TrendingDown className="h-8 w-8 text-white" />
                  </div>
                  <div className="text-5xl font-bold text-gray-400">Ventas perdidas</div>
                </div>
              </div>
            </div>

            <div className="pointer-events-none absolute left-1/2 top-1/2 -z-10 h-96 w-96 -translate-x-1/2 -translate-y-1/2 rounded-full bg-red-500/10 blur-3xl" />
          </div>
        </div>
      </div>
    </section>
  );
}
