import Link from "next/link";
import { buttonClasses } from "./button";

export function EmptyState({
  icon,
  title,
  body,
  actionLabel,
  actionHref,
}: {
  icon: React.ReactNode;
  title: string;
  body: string;
  actionLabel?: string;
  actionHref?: string;
}) {
  return (
    <div className="flex flex-col items-center rounded-2xl border border-dashed border-line bg-surface/60 px-6 py-14 text-center">
      <span className="grid size-12 place-items-center rounded-full border border-line bg-white text-ink-400">
        {icon}
      </span>
      <p className="mt-4 font-display text-[16px] font-bold text-ink">{title}</p>
      <p className="mt-1.5 max-w-[44ch] text-[13px] leading-relaxed text-ink-500">{body}</p>
      {actionLabel && actionHref && (
        <Link href={actionHref} className={buttonClasses("primary", "sm", "mt-5")}>
          {actionLabel}
        </Link>
      )}
    </div>
  );
}
