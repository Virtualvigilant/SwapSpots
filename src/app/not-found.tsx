import Link from "next/link";
import { Compass } from "lucide-react";
import { Shell } from "@/components/layout/shell";
import { buttonClasses } from "@/components/ui/button";

export default function NotFound() {
  return (
    <Shell>
      <div className="container-page flex flex-col items-center py-24 text-center">
        <span className="grid size-14 place-items-center rounded-full border border-line bg-surface text-ink-400">
          <Compass className="size-6" strokeWidth={1.7} />
        </span>
        <p className="mt-6 font-display text-[13px] font-bold uppercase tracking-[0.18em] text-brand">
          404
        </p>
        <h1 className="mt-2 font-display text-[34px] font-extrabold tracking-[-0.04em] text-ink">
          This page is gone
        </h1>
        <p className="mt-3 max-w-[46ch] text-[14px] leading-relaxed text-ink-500">
          It may have been a listing that sold, or a request that closed. Listings
          expire after 30 days, so links do go stale.
        </p>
        <div className="mt-7 flex flex-wrap justify-center gap-3">
          <Link href="/browse" className={buttonClasses("primary", "md")}>
            Browse listings
          </Link>
          <Link href="/requests" className={buttonClasses("outline", "md")}>
            See the request board
          </Link>
        </div>
      </div>
    </Shell>
  );
}
