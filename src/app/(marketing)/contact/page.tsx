import type { Metadata } from "next";
import Link from "next/link";
import { Flag, Mail, MessageCircle, ShieldCheck } from "lucide-react";
import { site } from "@/lib/site";
import { PageHeader } from "@/components/ui/page-header";
import { ContactForm } from "@/components/shared/contact-form";
import { buttonClasses } from "@/components/ui/button";

export const metadata: Metadata = { title: "Contact" };

const TOPICS = [
  { value: "account", label: "My account" },
  { value: "verification", label: "Student verification" },
  { value: "listing", label: "A listing or request" },
  { value: "safety", label: "Safety or a scam" },
  { value: "other", label: "Something else" },
];

const SHORTCUTS = [
  {
    Icon: Flag,
    title: "Report a listing or user",
    body: "Faster than emailing. Reports go straight into the moderation queue.",
    href: "/report",
    cta: "Report something",
  },
  {
    Icon: ShieldCheck,
    title: "Verification stuck?",
    body: "Most submissions are reviewed within a day. Check what we look for first.",
    href: "/verification",
    cta: "How verification works",
  },
  {
    Icon: MessageCircle,
    title: "Trouble with a deal",
    body: "We do not mediate payments, but a pattern of complaints does get acted on.",
    href: "/how-it-works",
    cta: "How trading works",
  },
];

export default function ContactPage() {
  return (
    <>
      <PageHeader
        title="Contact us"
        lead="A real person reads these. We usually reply within a day, faster if it is a safety issue."
        crumbs={[{ label: "Contact" }]}
      />

      <div className="container-page grid gap-8 py-10 lg:grid-cols-[minmax(0,1fr)_320px]">
        <ContactForm topics={TOPICS} supportEmail={site.supportEmail} />

        <aside className="space-y-4">
          {SHORTCUTS.map(({ Icon, title, body, href, cta }) => (
            <div key={title} className="rounded-2xl border border-line bg-white p-5">
              <p className="flex items-center gap-2 text-[13.5px] font-bold text-ink">
                <Icon className="size-4 text-brand" strokeWidth={1.9} />
                {title}
              </p>
              <p className="mt-2 text-[12.5px] leading-relaxed text-ink-500">{body}</p>
              <Link href={href} className={buttonClasses("outline", "sm", "mt-3.5 w-full")}>
                {cta}
              </Link>
            </div>
          ))}

          <div className="rounded-2xl border border-line bg-surface p-5">
            <p className="flex items-center gap-2 text-[12.5px] font-bold text-ink">
              <Mail className="size-4 text-ink-400" />
              Prefer email?
            </p>
            <p className="mt-2 text-[12.5px] text-ink-500">{site.supportEmail}</p>
          </div>
        </aside>
      </div>
    </>
  );
}
