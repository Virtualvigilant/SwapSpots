import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/cn";

/** Plain links, so paging works without JavaScript and each page is shareable. */
export function Pagination({
  page,
  perPage,
  total,
  searchParams,
  basePath,
}: {
  page: number;
  perPage: number;
  total: number;
  searchParams: Record<string, string | string[] | undefined>;
  basePath: string;
}) {
  const pages = Math.ceil(total / perPage);
  if (pages <= 1) return null;

  const href = (n: number) => {
    const next = new URLSearchParams();
    for (const [key, value] of Object.entries(searchParams)) {
      if (key === "page" || value === undefined) continue;
      for (const v of Array.isArray(value) ? value : [value]) next.append(key, v);
    }
    if (n > 1) next.set("page", String(n));
    return `${basePath}${next.size ? `?${next}` : ""}`;
  };

  return (
    <nav
      aria-label="Pagination"
      className="mt-8 flex items-center justify-center gap-2"
    >
      <PageLink href={href(page - 1)} disabled={page <= 1} label="Previous">
        <ChevronLeft className="size-4" />
      </PageLink>
      <span className="px-3 text-[12.5px] text-ink-500">
        Page <span className="font-bold text-ink">{page}</span> of {pages}
      </span>
      <PageLink href={href(page + 1)} disabled={page >= pages} label="Next">
        <ChevronRight className="size-4" />
      </PageLink>
    </nav>
  );
}

function PageLink({
  href,
  disabled,
  label,
  children,
}: {
  href: string;
  disabled: boolean;
  label: string;
  children: React.ReactNode;
}) {
  const className = cn(
    "grid size-9 place-items-center rounded-lg border border-line bg-white text-ink-700",
    disabled ? "pointer-events-none opacity-40" : "hover:border-brand hover:text-brand",
  );

  if (disabled) {
    return (
      <span className={className} aria-disabled>
        {children}
      </span>
    );
  }
  return (
    <Link href={href} className={className} aria-label={label}>
      {children}
    </Link>
  );
}
