export function Stat({
  label,
  value,
  sub,
}: {
  label: string;
  value: string;
  sub?: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-line bg-white p-4">
      <p className="text-[11.5px] font-medium text-ink-500">{label}</p>
      <p className="mt-1.5 font-display text-[22px] font-extrabold tracking-[-0.03em] text-ink">
        {value}
      </p>
      {sub && <p className="mt-1 text-[11.5px] text-ink-400">{sub}</p>}
    </div>
  );
}
