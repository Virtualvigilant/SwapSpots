import { Star } from "lucide-react";

/** Five stars, filled up to `value`. Omit `count` to render the stars alone. */
export function Rating({ value, count }: { value: number; count?: number }) {
  const filled = Math.round(value);
  return (
    <div className="flex items-center gap-1.5">
      <div className="flex items-center gap-[1px]">
        {Array.from({ length: 5 }, (_, i) => (
          <Star
            key={i}
            className={`size-3 ${i < filled ? "fill-brand text-brand" : "fill-line text-line"}`}
            strokeWidth={0}
          />
        ))}
      </div>
      {count !== undefined && <span className="text-[11px] text-ink-400">({count})</span>}
    </div>
  );
}
