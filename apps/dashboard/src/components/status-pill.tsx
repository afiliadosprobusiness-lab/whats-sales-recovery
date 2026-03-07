type StatusPillProps = {
  value: string;
};

function getToneClass(value: string): string {
  const normalized = value.toLowerCase();

  if (["recovered", "replied", "yes", "connected"].includes(normalized)) {
    return "border-emerald-400/35 bg-emerald-500/10 text-emerald-200";
  }

  if (["idle", "scheduled", "pending_qr"].includes(normalized)) {
    return "border-amber-400/35 bg-amber-500/10 text-amber-100";
  }

  if (["failed", "error", "no"].includes(normalized)) {
    return "border-rose-400/35 bg-rose-500/10 text-rose-100";
  }

  return "border-white/15 bg-white/[0.05] text-slate-100";
}

export function StatusPill({ value }: StatusPillProps): JSX.Element {
  return (
    <span
      className={[
        "inline-flex rounded-full border px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide",
        getToneClass(value)
      ].join(" ")}
    >
      {value}
    </span>
  );
}
