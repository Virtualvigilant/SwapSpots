import Link from "next/link";
import { Sparkles } from "lucide-react";
import { buttonClasses } from "@/components/ui/button";

/**
 * The cold-start state. Every marketplace has one, and pretending otherwise
 * with placeholder inventory is how you lose the first hundred users — they
 * tap a listing, find it is not real, and do not come back.
 */
export function EmptyMarket() {
  return (
    <section className="bg-white py-10">
      <div className="container-page">
        <div className="flex flex-col items-center rounded-2xl border border-dashed border-line bg-surface/60 px-6 py-14 text-center">
          <span className="grid size-12 place-items-center rounded-full border border-line bg-white text-brand">
            <Sparkles className="size-5" />
          </span>
          <p className="mt-4 font-display text-[18px] font-bold text-ink">
            Nothing on the board yet
          </p>
          <p className="mt-2 max-w-[52ch] text-[13px] leading-relaxed text-ink-500">
            SwapSpot is brand new on this campus. Post the first listing, or say
            what you need and let sellers come to you — the request board works
            from day one, even before there is anything to browse.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Link href="/listings/new" className={buttonClasses("primary", "md")}>
              Post a listing
            </Link>
            <Link href="/requests/new" className={buttonClasses("outline", "md")}>
              Post a request
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
