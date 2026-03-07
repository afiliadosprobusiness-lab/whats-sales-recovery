type StatusPillProps = {
  value: string;
};

export function StatusPill({ value }: StatusPillProps): JSX.Element {
  const tone = getTone(value);

  return <span className={`status-pill status-pill--${tone}`}>{value}</span>;
}

function getTone(value: string): "neutral" | "success" | "warning" | "error" {
  const normalized = value.toLowerCase();

  if (normalized === "recovered" || normalized === "replied" || normalized === "yes") {
    return "success";
  }

  if (normalized === "idle" || normalized === "scheduled") {
    return "warning";
  }

  if (normalized === "failed") {
    return "error";
  }

  return "neutral";
}
