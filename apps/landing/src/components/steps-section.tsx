import { Plug, ScanSearch, Sparkles } from "lucide-react";

const steps = [
  {
    number: "01",
    title: "Conecta tu WhatsApp",
    description: "Integracion simple y segura en menos de 2 minutos. No requiere conocimientos tecnicos.",
    icon: <Plug className="h-8 w-8 text-white" />,
    cardClass: "from-blue-500/10 to-blue-600/5 border-blue-500/20",
    iconClass: "from-blue-500 to-blue-600 shadow-blue-500/50"
  },
  {
    number: "02",
    title: "Sistema detecta conversaciones abandonadas",
    description: "Inteligencia artificial monitorea tus chats 24/7 e identifica clientes que dejaron de responder.",
    icon: <ScanSearch className="h-8 w-8 text-white" />,
    cardClass: "from-purple-500/10 to-purple-600/5 border-purple-500/20",
    iconClass: "from-purple-500 to-purple-600 shadow-purple-500/50"
  },
  {
    number: "03",
    title: "Recupera ventas automaticamente",
    description: "Envia seguimientos personalizados en el momento perfecto y cierra mas ventas sin esfuerzo.",
    icon: <Sparkles className="h-8 w-8 text-white" />,
    cardClass: "from-green-500/10 to-green-600/5 border-green-500/20",
    iconClass: "from-green-500 to-green-600 shadow-green-500/50"
  }
];

export function HowItWorks(): JSX.Element {
  return (
    <section id="how-it-works" className="relative overflow-hidden px-4 py-32 sm:px-6">
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-transparent via-purple-950/5 to-transparent" />

      <div className="container relative z-10">
        <div className="mb-20 text-center">
          <h2 className="mb-6 text-4xl font-bold md:text-6xl">
            <span className="bg-gradient-to-r from-white via-white to-white/60 bg-clip-text text-transparent">Como funciona</span>
          </h2>
          <p className="mx-auto max-w-3xl text-xl leading-relaxed text-foreground/60">
            Tres pasos simples para empezar a recuperar ventas perdidas
          </p>
        </div>

        <div className="mx-auto grid max-w-6xl gap-8 lg:grid-cols-3">
          {steps.map((step, index) => (
            <div key={step.number} className="group relative">
              {index < steps.length - 1 ? (
                <div className="absolute left-[60%] top-24 z-0 hidden h-0.5 w-[80%] bg-gradient-to-r from-white/20 to-transparent lg:block" />
              ) : null}

              <div className={`ui-card relative h-full border bg-gradient-to-br p-8 ${step.cardClass}`}>
                <div className="absolute -left-4 -top-4 flex h-16 w-16 items-center justify-center rounded-2xl border border-white/20 bg-gradient-to-br from-background to-background/80 shadow-xl">
                  <span className="bg-gradient-to-br from-white to-white/60 bg-clip-text text-2xl font-bold text-transparent">
                    {step.number}
                  </span>
                </div>

                <div className={`mb-6 mt-8 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br shadow-lg ${step.iconClass}`}>
                  {step.icon}
                </div>

                <h3 className="mb-4 text-2xl font-bold text-white">{step.title}</h3>
                <p className="text-lg leading-relaxed text-foreground/70">{step.description}</p>

                <div className="pointer-events-none absolute -bottom-2 -right-2 h-24 w-24 rounded-full bg-gradient-to-br from-white/5 to-transparent blur-2xl transition-transform duration-500 group-hover:scale-150" />
              </div>
            </div>
          ))}
        </div>

        <div className="mt-16 text-center">
          <p className="mb-6 text-lg text-foreground/60">Configuracion completa en menos de 5 minutos</p>
          <div className="flex flex-col items-center justify-center gap-4 text-sm text-foreground/60 sm:flex-row sm:gap-6">
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-green-500" />
              <span>Sin tarjeta de credito</span>
            </div>
            <div className="hidden h-4 w-px bg-white/20 sm:block" />
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-green-500" />
              <span>Cancela cuando quieras</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
