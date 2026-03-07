import { BarChart3, CheckCircle2, Clock, DollarSign, MessageCircle, TrendingUp } from "lucide-react";

const recoveries = [
  { name: "Carlos M.", product: "Plan Premium", amount: "S/299", probability: 85, high: true },
  { name: "Ana L.", product: "Paquete Starter", amount: "S/149", probability: 72, high: true },
  { name: "Jorge R.", product: "Servicio Plus", amount: "S/399", probability: 91, high: true },
  { name: "Maria S.", product: "Plan Basico", amount: "S/99", probability: 58, high: false }
];

export function ProductPreview(): JSX.Element {
  return (
    <section id="product-preview" className="relative overflow-hidden px-4 py-32 sm:px-6">
      <div className="container relative z-10">
        <div className="mb-20 text-center">
          <h2 className="mb-6 text-4xl font-bold md:text-6xl">
            <span className="bg-gradient-to-r from-purple-400 via-blue-400 to-purple-400 bg-clip-text text-transparent">
              Dashboard inteligente
            </span>
          </h2>
          <p className="mx-auto max-w-3xl text-xl leading-relaxed text-foreground/60">
            Visualiza y controla todas tus conversaciones recuperadas en tiempo real
          </p>
        </div>

        <div className="relative mx-auto max-w-6xl">
          <div className="rounded-3xl bg-gradient-to-br from-purple-500/20 via-indigo-500/10 to-blue-500/20 p-[1px] shadow-[0_20px_45px_rgba(2,6,23,0.45)]">
            <div className="rounded-3xl border border-white/10 bg-background/95 p-8 backdrop-blur-xl">
              <div className="mb-8 flex flex-wrap items-center justify-between gap-4 border-b border-white/10 pb-6">
                <div>
                  <h3 className="text-2xl font-bold text-white">Panel de Control</h3>
                  <p className="text-foreground/60">Ultima actualizacion: hace 2 minutos</p>
                </div>
                <div className="rounded-full border border-green-500/20 bg-green-500/10 px-4 py-2 shadow-[0_8px_20px_rgba(16,185,129,0.2)]">
                  <span className="flex items-center gap-2 text-sm font-semibold text-green-400">
                    <span className="h-2 w-2 animate-pulse rounded-full bg-green-500" />
                    Activo
                  </span>
                </div>
              </div>

              <div className="mb-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
                <div className="ui-card rounded-2xl border-blue-500/25 bg-gradient-to-br from-blue-500/12 to-blue-600/5 p-6">
                  <div className="mb-3 flex items-center gap-3">
                    <MessageCircle className="h-5 w-5 text-blue-400" />
                    <span className="text-sm text-foreground/60">Conversaciones</span>
                  </div>
                  <div className="text-3xl font-bold text-white">247</div>
                  <div className="mt-1 text-sm text-green-400">+12% hoy</div>
                </div>

                <div className="ui-card rounded-2xl border-green-500/25 bg-gradient-to-br from-green-500/12 to-green-600/5 p-6">
                  <div className="mb-3 flex items-center gap-3">
                    <DollarSign className="h-5 w-5 text-green-400" />
                    <span className="text-sm text-foreground/60">Ingresos</span>
                  </div>
                  <div className="text-3xl font-bold text-white">S/42.5K</div>
                  <div className="mt-1 text-sm text-green-400">+27% este mes</div>
                </div>

                <div className="ui-card rounded-2xl border-purple-500/25 bg-gradient-to-br from-purple-500/12 to-purple-600/5 p-6">
                  <div className="mb-3 flex items-center gap-3">
                    <Clock className="h-5 w-5 text-purple-400" />
                    <span className="text-sm text-foreground/60">Seguimientos</span>
                  </div>
                  <div className="text-3xl font-bold text-white">89</div>
                  <div className="mt-1 text-sm text-purple-400">Activos ahora</div>
                </div>

                <div className="ui-card rounded-2xl border-yellow-500/25 bg-gradient-to-br from-yellow-500/12 to-orange-600/5 p-6">
                  <div className="mb-3 flex items-center gap-3">
                    <TrendingUp className="h-5 w-5 text-yellow-400" />
                    <span className="text-sm text-foreground/60">Conversion</span>
                  </div>
                  <div className="text-3xl font-bold text-white">34%</div>
                  <div className="mt-1 text-sm text-green-400">+8% vs anterior</div>
                </div>
              </div>

              <div>
                <div className="mb-4 flex items-center gap-2">
                  <BarChart3 className="h-5 w-5 text-foreground/60" />
                  <h4 className="font-semibold text-white">Recuperaciones recientes</h4>
                </div>
                <div className="space-y-3">
                  {recoveries.map((item) => (
                    <div key={item.name} className="ui-card rounded-xl border-white/10 p-4">
                      <div className="mb-2 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-purple-500 to-blue-600 font-semibold text-white shadow-md shadow-purple-500/40">
                            {item.name.charAt(0)}
                          </div>
                          <div>
                            <div className="font-semibold text-white">{item.name}</div>
                            <div className="text-sm text-foreground/60">{item.product}</div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-bold text-green-400">{item.amount}</div>
                          <div className="text-xs text-foreground/60">hace 5 min</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="h-2 flex-1 overflow-hidden rounded-full bg-white/10">
                          <div
                            className={`h-full rounded-full ${item.high ? "bg-gradient-to-r from-green-500 to-emerald-500" : "bg-gradient-to-r from-yellow-500 to-orange-500"}`}
                            style={{ width: `${item.probability}%` }}
                          />
                        </div>
                        <span className="text-sm font-semibold text-foreground/80">{item.probability}%</span>
                        {item.high ? <CheckCircle2 className="h-4 w-4 text-green-400" /> : null}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="pointer-events-none absolute -right-8 -top-8 -z-10 h-96 w-96 rounded-full bg-purple-500/20 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-8 -left-8 -z-10 h-96 w-96 rounded-full bg-blue-500/20 blur-3xl" />
        </div>
      </div>
    </section>
  );
}
