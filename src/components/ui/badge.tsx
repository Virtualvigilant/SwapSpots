import { cn } from "@/lib/cn";

export type BadgeTone =
  | "brand"
  | "ink"
  | "gold"
  | "muted"
  | "success"
  | "danger"
  | "info";

const TONES: Record<BadgeTone, string> = {
  brand: "bg-brand text-white",
  ink: "bg-ink text-white",
  gold: "bg-gold text-ink",
  muted: "bg-surface text-ink-500 border border-line",
  success: "bg-emerald-50 text-emerald-700 border border-emerald-200",
  danger: "bg-red-50 text-red-600 border border-red-200",
  info: "bg-brand-50 text-brand-700 border border-brand-100",
};

export function Badge({
  children,
  tone = "muted",
  className,
}: {
  children: React.ReactNode;
  tone?: BadgeTone;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-md px-2 py-1 text-[10.5px] font-bold leading-none",
        TONES[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}
