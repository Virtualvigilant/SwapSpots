import Link from "next/link";
import { ChevronRight } from "lucide-react";

export type Crumb = { label: string; href?: string };

/**
 * Standard page masthead: breadcrumb, title, one line of context, and an
 * optional action slot on the right.
 */
export function PageHeader({
  title,
  lead,
  crumbs = [],
  action,
}: {
  title: string;
  lead?: string;
  crumbs?: Crumb[];
  action?: React.ReactNode;
}) {
  return (
    <div className="border-b border-line bg-canvas">
      <div className="container-page py-8 sm:py-10">
        {crumbs.length > 0 && (
          <nav aria-label="Breadcrumb" className="mb-3 flex flex-wrap items-center gap-1 text-[12px] text-ink-400">
            <Link href="/" className="hover:text-brand">
              Home
            </Link>
            {crumbs.map((c) => (
              <span key={c.label} className="flex items-center gap-1">
                <ChevronRight className="size-3" />
                {c.href ? (
                  <Link href={c.href} className="hover:text-brand">
                    {c.label}
                  </Link>
                ) : (
                  <span className="text-ink-500">{c.label}</span>
                )}
              </span>
            ))}
          </nav>
        )}

        <div className="flex flex-wrap items-end justify-between gap-4">
          <div className="min-w-0">
            <h1 className="font-display text-[28px] font-extrabold tracking-[-0.035em] text-ink sm:text-[34px]">
              {title}
            </h1>
            {lead && (
              <p className="mt-2 max-w-[62ch] text-[14px] leading-relaxed text-ink-500">{lead}</p>
            )}
          </div>
          {action && <div className="shrink-0">{action}</div>}
        </div>
      </div>
    </div>
  );
}
