const metrics = [
  {
    label: "Clientes recuperados",
    value: "+27%"
  },
  {
    label: "Ventas recuperadas",
    value: "+19%"
  },
  {
    label: "Ingresos recuperados",
    value: "S/ 12,540"
  }
];

export function MetricsSection(): JSX.Element {
  return (
    <section className="section">
      <div className="section__content">
        <h2 className="section__title">Resultados visibles</h2>
        <div className="metrics-grid">
          {metrics.map((metric) => (
            <article className="metric-card" key={metric.label}>
              <p className="metric-card__label">{metric.label}</p>
              <p className="metric-card__value">{metric.value}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
