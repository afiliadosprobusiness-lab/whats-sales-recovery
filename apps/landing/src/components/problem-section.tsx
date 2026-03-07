const problemFlow = [
  "Clientes preguntan por WhatsApp",
  "negocio responde",
  "cliente desaparece",
  "venta perdida"
];

export function ProblemSection(): JSX.Element {
  return (
    <section className="section">
      <div className="section__content">
        <h2 className="section__title">El problema diario</h2>
        <p className="section__subtitle">
          Cada conversación incompleta es una venta que pudo cerrarse.
        </p>
        <div className="flow">
          {problemFlow.map((step, index) => (
            <div className="flow__item" key={step}>
              <span>{step}</span>
              {index < problemFlow.length - 1 ? (
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
