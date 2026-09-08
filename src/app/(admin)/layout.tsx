import Link from "next/link";
import { ExternalLink } from "lucide-react";
import { site } from "@/lib/site";
import { AdminNav } from "@/components/layout/admin-nav";

/**
 * Admin gets deliberately different chrome from the marketplace — a dark shell,
 * so a moderator can never mistake a moderation view for a public page.
 */
export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-dvh bg-canvas">
      <header className="bg-ink">
        <div className="container-page flex h-16 items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link href="/" className="font-display text-[19px] font-extrabold tracking-[-0.04em]">
              <span className="text-white">{site.nameLead}</span>
              <span className="text-brand">{site.nameTail}</span>
            </Link>
            <span className="rounded-md bg-white/10 px-2 py-1 text-[10.5px] font-bold uppercase tracking-wider text-white/70">
              Admin
            </span>
          </div>
          <Link
            href="/"
            className="flex items-center gap-1.5 text-[12.5px] text-white/60 hover:text-white"
          >
            Back to marketplace
            <ExternalLink className="size-3.5" />
          </Link>
        </div>
      </header>

      <div className="container-page grid gap-8 py-8 lg:grid-cols-[210px_minmax(0,1fr)]">
        <div className="rounded-2xl bg-ink p-3 lg:self-start">
          <AdminNav />
        </div>
        <main>{children}</main>
      </div>
    </div>
  );
}
