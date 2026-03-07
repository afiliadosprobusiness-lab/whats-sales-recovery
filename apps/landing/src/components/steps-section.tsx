const steps = [
  {
    number: "1",
    title: "Conecta tu WhatsApp"
  },
  {
    number: "2",
    title: "RecuperaVentas monitorea conversaciones"
  },
  {
    number: "3",
    title: "Recupera clientes automáticamente"
  }
];

export function StepsSection(): JSX.Element {
  return (
    <section className="section">
      <div className="section__content">
        <h2 className="section__title">Cómo funciona</h2>
        <div className="steps-grid">
          {steps.map((step) => (
            <article className="step-card" key={step.number}>
              <p className="step-card__number">{step.number}</p>
              <p className="step-card__title">{step.title}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
