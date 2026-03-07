import { ArrowRight, HeadphonesIcon, MessageCircle, Shield, Zap } from "lucide-react";

const trustBadges = [
  {
    icon: <Shield className="h-6 w-6 text-green-400" />,
    title: "100% Seguro",
    sub: "Datos encriptados",
    className: "from-green-500/20 to-green-600/10"
  },
  {
    icon: <Zap className="h-6 w-6 text-blue-400" />,
    title: "Setup Rapido",
    sub: "Menos de 5 min",
    className: "from-blue-500/20 to-blue-600/10"
  },
  {
    icon: <HeadphonesIcon className="h-6 w-6 text-purple-400" />,
    title: "Soporte 24/7",
    sub: "Siempre disponible",
    className: "from-purple-500/20 to-purple-600/10"
  }
];

export function CTASection(): JSX.Element {
  return (
    <section id="cta" className="relative overflow-hidden px-4 py-32 sm:px-6">
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-purple-600/20 via-blue-600/20 to-purple-600/20" />
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-background via-transparent to-background" />

      <div className="container relative z-10 max-w-5xl">
        <div className="relative">
          <div className="rounded-3xl bg-gradient-to-br from-purple-500 via-indigo-500 to-blue-600 p-[1px] shadow-[0_20px_46px_rgba(2,6,23,0.5)]">
            <div className="rounded-3xl bg-gradient-to-br from-background/95 to-background/80 p-12 text-center backdrop-blur-xl md:p-16">
              <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-purple-500/30 bg-gradient-to-r from-purple-500/20 to-blue-500/20 px-4 py-2 shadow-[0_8px_18px_rgba(79,70,229,0.3)]">
                <Zap className="h-4 w-4 text-yellow-400" />
                <span className="text-sm font-semibold text-foreground">Comienza gratis hoy</span>
              </div>

              <h2 className="mb-6 text-4xl font-bold leading-tight md:text-6xl lg:text-7xl">
                <span className="bg-gradient-to-r from-white via-white to-white/60 bg-clip-text text-transparent">
                  Empieza a recuperar ventas hoy
                </span>
              </h2>

              <p className="mx-auto mb-12 max-w-3xl text-xl leading-relaxed text-foreground/70 md:text-2xl">
                Miles de negocios ya estan recuperando clientes perdidos. No dejes que tus ventas se escapen.
              </p>

              <button className="ui-btn-primary mb-8 px-10 py-6 text-xl font-bold md:text-2xl">
                <MessageCircle className="h-6 w-6" />
                Conectar mi WhatsApp
                <ArrowRight className="h-6 w-6 transition-transform group-hover:translate-x-1" />
              </button>

              <p className="mb-12 text-sm text-foreground/60">
                Configuracion en 2 minutos • Sin tarjeta de credito • Cancela cuando quieras
              </p>

              <div className="grid gap-6 border-t border-white/10 pt-8 md:grid-cols-3">
                {trustBadges.map((badge) => (
                  <div key={badge.title} className="ui-card flex items-center justify-center gap-3 rounded-2xl border-white/10 p-4">
                    <div className={`flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br ${badge.className}`}>
                      {badge.icon}
                    </div>
                    <div className="text-left">
                      <div className="text-sm font-semibold text-white">{badge.title}</div>
                      <div className="text-xs text-foreground/60">{badge.sub}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="pointer-events-none absolute -left-24 -top-24 -z-10 h-96 w-96 rounded-full bg-purple-500/30 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-24 -right-24 -z-10 h-96 w-96 rounded-full bg-blue-500/30 blur-3xl" />
        </div>
      </div>
    </section>
  );
}
