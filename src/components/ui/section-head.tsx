import Link from "next/link";
import { ArrowRight } from "lucide-react";

export function SectionHead({
  title,
  href,
  linkLabel,
}: {
  title: string;
  href: string;
  linkLabel: string;
}) {
  return (
    <div className="mb-5 flex items-end justify-between gap-4">
      <h2 className="section-title text-ink">{title}</h2>
      <Link
        href={href}
        className="group flex shrink-0 items-center gap-1.5 text-[12.5px] font-medium text-ink-500 transition-colors hover:text-brand"
      >
        {linkLabel}
        <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" />
      </Link>
    </div>
  );
}
