import Link from "next/link";
import { site } from "@/lib/site";

export function Logo({ className = "" }: { className?: string }) {
  return (
    <Link
      href="/"
      aria-label={`${site.name} home`}
      className={`font-display text-[22px] font-extrabold tracking-[-0.04em] ${className}`}
    >
      <span className="text-ink">{site.nameLead}</span>
      <span className="text-brand">{site.nameTail}</span>
    </Link>
  );
}
