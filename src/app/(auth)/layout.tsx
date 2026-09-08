import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Logo } from "@/components/layout/logo";
import { site } from "@/lib/site";

/**
 * Auth pages get their own minimal chrome — no nav, no footer. A split layout
 * keeps the trust copy visible next to the form on desktop.
 */
export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid min-h-dvh lg:grid-cols-2">
      <div className="flex flex-col px-5 py-8 sm:px-10">
        <div className="flex items-center justify-between">
          <Logo />
          <Link
            href="/"
            className="flex items-center gap-1.5 text-[13px] font-medium text-ink-500 hover:text-brand"
          >
            <ArrowLeft className="size-4" />
            Back to site
          </Link>
        </div>
        <div className="flex flex-1 items-center justify-center py-10">
          <div className="w-full max-w-[400px]">{children}</div>
        </div>
      </div>

      <aside className="relative hidden overflow-hidden bg-ink px-12 lg:flex lg:flex-col lg:justify-center">
        <div
          aria-hidden="true"
          className="absolute -right-24 -top-24 size-[420px] rounded-full bg-brand/25 blur-3xl"
        />
        <div
          aria-hidden="true"
          className="absolute -bottom-32 -left-20 size-[380px] rounded-full bg-brand/15 blur-3xl"
        />
        <div className="relative max-w-[420px]">
          <p className="text-[12px] font-bold uppercase tracking-[0.18em] text-brand">
            {site.tagline}
          </p>
          <h2 className="mt-4 font-display text-[36px] font-extrabold leading-[1.1] tracking-[-0.04em] text-white">
            A marketplace where everyone is a neighbour.
          </h2>
          <p className="mt-5 text-[14px] leading-relaxed text-white/60">
            Every account on {site.name} belongs to a verified {site.campus} student. A
            seller who disappears can be found in a lecture hall — which is why
            this works and a WhatsApp group does not.
          </p>
          <ul className="mt-8 space-y-3.5">
            {[
              "No commission, ever — we never touch your money",
              "Separate buyer and seller reputation",
              "Post a request and let sellers bid for it",
            ].map((point) => (
              <li key={point} className="flex items-start gap-3 text-[13.5px] text-white/80">
                <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-brand" />
                {point}
              </li>
            ))}
          </ul>
        </div>
      </aside>
    </div>
  );
}
