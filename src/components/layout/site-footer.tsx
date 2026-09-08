import Link from "next/link";
import { site } from "@/lib/site";
import type { CategorySummary } from "@/lib/queries/categories";
import { InstagramIcon, XIcon } from "@/components/ui/brand-icons";

const columns = [
  {
    title: "Marketplace",
    links: [
      { label: "Browse listings", href: "/browse" },
      { label: "Request board", href: "/requests" },
      { label: "Post a listing", href: "/listings/new" },
      { label: "Post a request", href: "/requests/new" },
    ],
  },
  {
    title: "Company",
    links: [
      { label: "How it works", href: "/how-it-works" },
      { label: "About", href: "/about" },
      { label: "Contact", href: "/contact" },
      { label: "Blog", href: "/blog" },
    ],
  },
  {
    title: "Safety",
    links: [
      { label: "Student verification", href: "/verification" },
      { label: "Prohibited items", href: "/prohibited-items" },
      { label: "Report a problem", href: "/report" },
      { label: "Admin", href: "/admin/reports" },
      { label: "Terms & privacy", href: "/terms" },
    ],
  },
];

export function SiteFooter({
  categories,
}: {
  categories: CategorySummary[];
}) {
  return (
    <footer className="border-t border-line bg-canvas">
      <div className="container-page grid gap-10 py-14 md:grid-cols-[1.4fr_repeat(3,1fr)]">
        <div>
          <p className="font-display text-[22px] font-extrabold tracking-[-0.04em]">
            <span className="text-ink">{site.nameLead}</span>
            <span className="text-brand">{site.nameTail}</span>
          </p>
          <p className="mt-3 max-w-[280px] text-[13px] leading-relaxed text-ink-500">
            The campus marketplace for {site.campus}. Discovery only — {site.whatsappNote}
          </p>
          <div className="mt-5 flex gap-2">
            {[InstagramIcon, XIcon].map((Icon, i) => (
              <a
                key={i}
                href="#"
                aria-label="SwapSpot social profile"
                className="grid size-9 place-items-center rounded-full border border-line bg-white text-ink-500 transition-colors hover:border-brand hover:text-brand"
              >
                <Icon className="size-4" />
              </a>
            ))}
          </div>
        </div>

        {columns.map((col) => (
          <div key={col.title}>
            <p className="text-[13px] font-bold text-ink">{col.title}</p>
            <ul className="mt-4 space-y-2.5">
              {col.links.map((l) => (
                <li key={l.label}>
                  <Link
                    href={l.href}
                    className="text-[13px] text-ink-500 transition-colors hover:text-brand"
                  >
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div className="border-t border-line">
        <div className="container-page flex flex-col gap-3 py-5 text-[12px] text-ink-400 sm:flex-row sm:items-center sm:justify-between">
          <p>
            © {new Date().getFullYear()} {site.name}. Built for {site.campus}.
          </p>
          <ul className="flex flex-wrap gap-x-4 gap-y-1">
            {categories.slice(0, 4).map((c) => (
              <li key={c.slug}>
                <Link href={`/browse/${c.slug}`} className="hover:text-brand">
                  {c.name}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </footer>
  );
}
