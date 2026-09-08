"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/cn";

export type Tab = { label: string; href: string; count?: number };

/** Underlined link tabs. Active state comes from the pathname, not props. */
export function TabNav({ tabs }: { tabs: Tab[] }) {
  const pathname = usePathname();

  return (
    <div className="no-scrollbar -mb-px flex gap-6 overflow-x-auto border-b border-line">
      {tabs.map((t) => {
        const active = pathname === t.href;
        return (
          <Link
            key={t.href}
            href={t.href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "flex shrink-0 items-center gap-2 border-b-2 pb-3 text-[13.5px] font-semibold transition-colors",
              active
                ? "border-brand text-ink"
                : "border-transparent text-ink-500 hover:text-ink",
            )}
          >
            {t.label}
            {t.count !== undefined && (
              <span
                className={cn(
                  "rounded-full px-1.5 py-0.5 text-[10.5px] font-bold leading-none",
                  active ? "bg-brand text-white" : "bg-surface text-ink-500",
                )}
              >
                {t.count}
              </span>
            )}
          </Link>
        );
      })}
    </div>
  );
}
