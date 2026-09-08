import type { Metadata } from "next";
import Link from "next/link";
import { Info } from "lucide-react";
import { getUser } from "@/lib/queries/session";
import { PageHeader } from "@/components/ui/page-header";
import { buttonClasses } from "@/components/ui/button";
import { ReportPageForm } from "@/components/shared/report-page-form";

export const metadata: Metadata = { title: "Report a problem" };


const REASONS = [
  { value: "Prohibited item or service", label: "Prohibited item or service" },
  { value: "Academic dishonesty", label: "Academic dishonesty" },
  { value: "Scam or fraud", label: "Scam or fraud" },
  { value: "Harassment or abusive language", label: "Harassment or abusive language" },
  { value: "Misleading description", label: "Misleading description" },
  { value: "Wrong category", label: "Wrong category" },
  { value: "Something else", label: "Something else" },
];

export default async function ReportPage() {
  const user = await getUser();

  return (
    <>
      <PageHeader
        title="Report a problem"
        lead="Tell us what you saw and where. Reports go straight into the moderation queue and are read by a person, usually within a few hours."
        crumbs={[{ label: "Report" }]}
      />

      <div className="container-page grid gap-8 py-10 lg:grid-cols-[minmax(0,1fr)_320px]">
        <ReportPageForm reasons={REASONS} signedIn={Boolean(user)} />

        <aside className="space-y-4">
          <div className="rounded-2xl border border-line bg-surface p-5">
            <p className="flex items-center gap-2 text-[12.5px] font-bold text-ink">
              <Info className="size-4 text-brand" />
              What happens next
            </p>
            <ol className="mt-3 space-y-2.5 text-[12.5px] leading-relaxed text-ink-500">
              <li>1. Your report enters the moderation queue immediately.</li>
              <li>2. A moderator hides, removes or dismisses it.</li>
              <li>3. You are notified of the outcome.</li>
              <li>
                4. Three upheld reports against the same account within 90 days
                suspends it automatically.
              </li>
            </ol>
          </div>

          <div className="rounded-2xl border border-line bg-white p-5">
            <p className="text-[12.5px] font-bold text-ink">In immediate danger?</p>
            <p className="mt-2 text-[12.5px] leading-relaxed text-ink-500">
              This form is not an emergency channel. Contact campus security or
              the police first, then report here so we can act on the account.
            </p>
            <Link href="/prohibited-items" className={buttonClasses("outline", "sm", "mt-4 w-full")}>
              What is prohibited
            </Link>
          </div>
        </aside>
      </div>
    </>
  );
}
