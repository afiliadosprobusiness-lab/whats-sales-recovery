const solutionFlow = [
  "Cliente pregunta",
  "cliente desaparece",
  "RecuperaVentas envía seguimiento",
  "cliente responde",
  "venta recuperada"
];

export function SolutionSection(): JSX.Element {
  return (
    <section className="section section--accent">
      <div className="section__content">
        <h2 className="section__title">La solución automática</h2>
        <p className="section__subtitle">
          RecuperaVentas sigue la conversación cuando el cliente se enfría.
        </p>
        <div className="flow flow--success">
          {solutionFlow.map((step, index) => (
            <div className="flow__item" key={step}>
              <span>{step}</span>
              {index < solutionFlow.length - 1 ? (
                <span className="flow__arrow" aria-hidden="true">
                  ↓
                </span>
              ) : null}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
