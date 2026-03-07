import { DollarSign, TrendingUp, Users } from "lucide-react";

type MetricCardProps = {
  icon: JSX.Element;
  value: string;
  label: string;
  description: string;
  glowClass: string;
  valueClass: string;
  panelClass: string;
  iconBoxClass: string;
  wrapperClass?: string;
};

function MetricCard({
  icon,
  value,
  label,
  description,
  glowClass,
  valueClass,
  panelClass,
  iconBoxClass,
  wrapperClass
}: MetricCardProps): JSX.Element {
  return (
    <div className={`group relative ${wrapperClass ?? ""}`}>
      <div className={`pointer-events-none absolute inset-0 rounded-3xl blur-xl opacity-20 transition-all duration-300 group-hover:opacity-35 ${glowClass}`} />
      <div className={`ui-card relative border-white/20 bg-gradient-to-br p-8 ${panelClass}`}>
        <div className={`mb-6 flex h-14 w-14 items-center justify-center rounded-2xl shadow-lg ${iconBoxClass}`}>{icon}</div>
        <div className="mb-2">
          <div className={`mb-2 text-6xl font-bold md:text-7xl ${valueClass}`}>{value}</div>
          <div className="mb-2 text-xl font-semibold text-white">{label}</div>
          <p className="leading-relaxed text-foreground/60">{description}</p>
        </div>
      </div>
    </div>
  );
}

export function ResultsSection(): JSX.Element {
  return (
    <section id="results" className="relative overflow-hidden px-4 py-32 sm:px-6">
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-transparent via-blue-950/10 to-transparent" />

      <div className="container relative z-10">
        <div className="mb-20 text-center">
          <h2 className="mb-6 text-4xl font-bold md:text-6xl">
            <span className="bg-gradient-to-r from-yellow-400 via-orange-400 to-yellow-400 bg-clip-text text-transparent">
              Resultados reales
            </span>
          </h2>
          <p className="mx-auto max-w-3xl text-xl leading-relaxed text-foreground/60">
            Datos promedio de nuestros clientes en los primeros 30 dias
          </p>
        </div>

        <div className="mx-auto grid max-w-6xl gap-8 md:grid-cols-2 lg:grid-cols-3">
          <MetricCard
            icon={<Users className="h-7 w-7 text-white" />}
            value="+27%"
            label="Clientes recuperados"
            description="De clientes que desaparecieron vuelven a la conversacion"
            glowClass="bg-gradient-to-br from-blue-500 to-purple-600"
            valueClass="bg-gradient-to-br from-blue-400 to-blue-600 bg-clip-text text-transparent"
            panelClass="from-blue-500/10 to-purple-600/10"
            iconBoxClass="bg-gradient-to-br from-blue-500 to-blue-600 shadow-blue-500/50"
          />
          <MetricCard
            icon={<TrendingUp className="h-7 w-7 text-white" />}
            value="+19%"
            label="Ventas adicionales"
            description="Incremento en conversiones totales mes a mes"
            glowClass="bg-gradient-to-br from-green-500 to-emerald-600"
            valueClass="bg-gradient-to-br from-green-400 to-green-600 bg-clip-text text-transparent"
            panelClass="from-green-500/10 to-emerald-600/10"
            iconBoxClass="bg-gradient-to-br from-green-500 to-green-600 shadow-green-500/50"
          />
          <MetricCard
            icon={<DollarSign className="h-7 w-7 text-white" />}
            value="S/12,540"
            label="Ingresos recuperados"
            description="Promedio de ingresos extras por mes por cliente"
            glowClass="bg-gradient-to-br from-yellow-500 to-orange-600"
            valueClass="bg-gradient-to-br from-yellow-400 to-orange-600 bg-clip-text text-transparent"
            panelClass="from-yellow-500/10 to-orange-600/10"
            iconBoxClass="bg-gradient-to-br from-yellow-500 to-orange-600 shadow-yellow-500/50"
            wrapperClass="md:col-span-2 lg:col-span-1"
          />
        </div>

        <div className="mx-auto mt-16 grid max-w-5xl grid-cols-2 gap-6 md:grid-cols-4">
          <div className="ui-card rounded-2xl border-white/10 p-6 text-center">
            <div className="mb-1 text-3xl font-bold text-white">2.4x</div>
            <div className="text-sm text-foreground/60">ROI promedio</div>
          </div>
          <div className="ui-card rounded-2xl border-white/10 p-6 text-center">
            <div className="mb-1 text-3xl font-bold text-white">85%</div>
            <div className="text-sm text-foreground/60">Tasa de respuesta</div>
          </div>
          <div className="ui-card rounded-2xl border-white/10 p-6 text-center">
            <div className="mb-1 text-3xl font-bold text-white">24/7</div>
            <div className="text-sm text-foreground/60">Disponibilidad</div>
          </div>
          <div className="ui-card rounded-2xl border-white/10 p-6 text-center">
            <div className="mb-1 text-3xl font-bold text-white">&lt;2min</div>
            <div className="text-sm text-foreground/60">Tiempo de respuesta</div>
          </div>
        </div>
      </div>
    </section>
  );
}
