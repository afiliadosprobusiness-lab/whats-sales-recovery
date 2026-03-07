import { ArrowRight, Clock, MessageSquare, TrendingUp, Zap } from "lucide-react";

function FlowCard({
  title,
  description,
  icon,
  gradient,
  border,
  iconGradient
}: {
  title: string;
  description: string;
  icon: JSX.Element;
  gradient: string;
  border: string;
  iconGradient: string;
}): JSX.Element {
  return (
    <div className={`ui-card border ${border} bg-gradient-to-br ${gradient} p-8`}>
      <div className="flex items-center gap-6">
        <div className={`flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br shadow-lg ${iconGradient}`}>
          {icon}
        </div>
        <div className="flex-1">
          <h3 className="mb-2 text-2xl font-bold text-white">{title}</h3>
          <p className="text-lg leading-relaxed text-foreground/70">{description}</p>
        </div>
      </div>
    </div>
  );
}

export function SolutionSection(): JSX.Element {
  return (
    <section id="solution" className="relative overflow-hidden px-4 py-32 sm:px-6">
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-transparent via-purple-950/10 to-transparent" />

      <div className="container relative z-10">
        <div className="mb-20 text-center">
          <h2 className="mb-6 text-4xl font-bold md:text-6xl">
            <span className="bg-gradient-to-r from-green-400 via-emerald-400 to-green-400 bg-clip-text text-transparent">
              La solucion automatica
            </span>
          </h2>
          <p className="mx-auto max-w-3xl text-xl leading-relaxed text-foreground/60">
            RecuperaVentas trabaja 24/7 para que ningun cliente se escape
          </p>
        </div>

        <div className="mx-auto max-w-5xl space-y-5">
          <FlowCard
            title="Cliente pregunta"
            description="Un cliente potencial inicia una conversacion en WhatsApp"
            icon={<MessageSquare className="h-8 w-8 text-white" />}
            gradient="from-blue-500/10 to-blue-600/5"
            border="border-blue-500/20"
            iconGradient="from-blue-500 to-blue-600 shadow-blue-500/45"
          />

          <div className="flex justify-center py-1">
            <ArrowRight className="h-8 w-8 rotate-90 text-blue-500/80" />
          </div>

          <FlowCard
            title="Cliente desaparece"
            description="El cliente no responde o se distrae con otras cosas"
            icon={<Clock className="h-8 w-8 text-white" />}
            gradient="from-orange-500/10 to-orange-600/5"
            border="border-orange-500/20"
            iconGradient="from-orange-500 to-orange-600 shadow-orange-500/45"
          />

          <div className="flex justify-center py-1">
            <ArrowRight className="h-8 w-8 rotate-90 text-orange-500/80" />
          </div>

          <div className="ui-card relative border-purple-500/40 bg-gradient-to-br from-purple-500/20 to-blue-500/20 p-8">
            <div className="pointer-events-none absolute inset-0 rounded-3xl bg-gradient-to-r from-purple-500/20 to-blue-500/20 blur-xl" />
            <div className="relative flex items-center gap-6">
              <div className="flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-purple-500 to-blue-600 shadow-lg shadow-purple-500/50">
                <Zap className="h-8 w-8 text-white" />
              </div>
              <div className="flex-1">
                <div className="mb-2 flex flex-wrap items-center gap-2">
                  <h3 className="text-2xl font-bold text-white">RecuperaVentas envia seguimiento automatico</h3>
                  <span className="rounded-full bg-yellow-500 px-3 py-1 text-sm font-bold text-black shadow-sm">AUTO</span>
                </div>
                <p className="text-lg leading-relaxed text-foreground/70">
                  Sistema detecta la inactividad y envia un mensaje personalizado en el momento perfecto
                </p>
              </div>
            </div>
          </div>

          <div className="flex justify-center py-1">
            <ArrowRight className="h-8 w-8 rotate-90 text-purple-500/80" />
          </div>

          <FlowCard
            title="Cliente responde"
            description="El cliente vuelve a la conversacion y retoma el interes"
            icon={<MessageSquare className="h-8 w-8 text-white" />}
            gradient="from-green-500/10 to-green-600/5"
            border="border-green-500/20"
            iconGradient="from-green-500 to-green-600 shadow-green-500/45"
          />

          <div className="flex justify-center py-1">
            <ArrowRight className="h-8 w-8 rotate-90 text-green-500/80" />
          </div>

          <div className="ui-card relative border-green-500/40 bg-gradient-to-br from-green-500/20 to-emerald-500/20 p-8">
            <div className="pointer-events-none absolute inset-0 rounded-3xl bg-gradient-to-r from-green-500/20 to-emerald-500/20 blur-xl" />
            <div className="relative flex items-center gap-6">
              <div className="flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-green-500 to-emerald-600 shadow-lg shadow-green-500/50">
                <TrendingUp className="h-8 w-8 text-white" />
              </div>
              <div className="flex-1">
                <h3 className="mb-2 text-2xl font-bold text-white">Venta recuperada</h3>
                <p className="text-lg leading-relaxed text-foreground/70">
                  Conversion exitosa de un cliente que se habria perdido
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
