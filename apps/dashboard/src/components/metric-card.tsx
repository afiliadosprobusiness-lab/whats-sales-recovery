type MetricCardProps = {
  label: string;
  value: string;
  tone?: "default" | "highlight";
};

export function MetricCard({
  label,
  value,
  tone = "default"
}: MetricCardProps): JSX.Element {
  return (
    <article className={`metric-card metric-card--${tone}`}>
      <p className="metric-card__label">{label}</p>
      <p className="metric-card__value">{value}</p>
    </article>
  );
}
