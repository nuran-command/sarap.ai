type MetricCardProps = {
  label: string;
  value: string | number;
  tone?: "neutral" | "warning" | "danger";
};

const toneClassName = {
  neutral: "border-stone-200 bg-white",
  warning: "border-gold/35 bg-amber-50",
  danger: "border-tomato/35 bg-red-50",
};

export function MetricCard({ label, value, tone = "neutral" }: MetricCardProps) {
  return (
    <div className={`rounded-lg border p-4 ${toneClassName[tone]}`}>
      <p className="text-sm text-stone-500">{label}</p>
      <p className="mt-2 text-3xl font-semibold text-ink">{value}</p>
    </div>
  );
}

