type MetricCardProps = {
  label: string;
  value: string;
  delta: string;
};

export function MetricCard({ label, value, delta }: MetricCardProps): JSX.Element {
  return (
    <article className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 shadow-glow">
      <p className="text-sm text-slate-300">{label}</p>
      <p className="mt-2 text-3xl font-semibold text-white">{value}</p>
      <p className="mt-3 text-xs text-cyan-300">{delta}</p>
    </article>
  );
}
