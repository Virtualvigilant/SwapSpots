import type { Metadata } from "next";
import Link from "next/link";
import { AlertTriangle, ShieldCheck } from "lucide-react";
import { getReports } from "@/lib/queries/admin";
import { timeAgo } from "@/lib/format";
import { SectionLead } from "@/components/ui/section-lead";
import { Badge, type BadgeTone } from "@/components/ui/badge";
import { Stat } from "@/components/ui/stat";
import { EmptyState } from "@/components/ui/empty-state";
import { ReportActions } from "@/components/admin/report-actions";
import type { Database } from "@/types/database";

export const metadata: Metadata = { title: "Reports" };

const STATUS: Record<
  Database["public"]["Enums"]["report_status"],
  { label: string; tone: BadgeTone }
> = {
  open: { label: "Open", tone: "danger" },
  reviewing: { label: "Reviewing", tone: "info" },
  actioned: { label: "Actioned", tone: "success" },
  dismissed: { label: "Dismissed", tone: "muted" },
};

export default async function AdminReportsPage() {
  const reports = await getReports();
  const needsDecision = reports.filter(
    (r) => r.status === "open" || r.status === "reviewing",
  );
  const upheldThisWeek = reports.filter(
    (r) =>
      r.status === "actioned" &&
      Date.now() - new Date(r.created_at).getTime() < 7 * 86_400_000,
  ).length;

  return (
    <>
      <SectionLead
        title="Moderation queue"
        lead="Enforce consistently. Half-enforcement is worse than either removing content or looking away, and it undermines the ratings system too."
      />

      <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat label="Needs a decision" value={String(needsDecision.length)} />
        <Stat label="Total reports" value={String(reports.length)} />
        <Stat label="Upheld this week" value={String(upheldThisWeek)} />
        <Stat
          label="Dismissed"
          value={String(reports.filter((r) => r.status === "dismissed").length)}
        />
      </div>

      {reports.length === 0 ? (
        <EmptyState
          icon={<ShieldCheck className="size-5" />}
          title="Nothing reported"
          body="An empty queue on a new campus board is normal. Expect the first prohibited request inside a week — the keyword pre-screen will flag most of them here first."
        />
      ) : (
        <ul className="space-y-3">
          {reports.map((r) => {
            const { label, tone } = STATUS[r.status];
            return (
              <li key={r.id} className="rounded-2xl border border-line bg-white p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge tone={tone}>{label}</Badge>
                      <Badge tone="muted">{r.target_type}</Badge>
                      <span className="text-[11.5px] text-ink-400">
                        {timeAgo(r.created_at)}
                      </span>
                    </div>
                    <Link
                      href={r.targetHref}
                      className="mt-2 block text-[14px] font-bold text-ink hover:text-brand"
                    >
                      {r.targetLabel}
                    </Link>
                    <p className="mt-1 text-[12.5px] font-semibold text-brand">
                      {r.reason}
                    </p>
                  </div>

                  {r.strikes >= 3 && (
                    <span className="flex shrink-0 items-center gap-1.5 rounded-lg bg-red-50 px-2.5 py-1.5 text-[11.5px] font-bold text-red-600">
                      <AlertTriangle className="size-3.5" />
                      {r.strikes} strikes — suspended
                    </span>
                  )}
                </div>

                {r.details && (
                  <p className="mt-3 text-[13px] leading-relaxed text-ink-500">
                    {r.details}
                  </p>
                )}

                <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-line pt-4">
                  <p className="text-[11.5px] text-ink-400">
                    Reported by @{r.reporter?.username ?? "unknown"}
                    {r.ownerUsername && <> · against @{r.ownerUsername}</>} ·{" "}
                    {r.strikes} upheld in 90 days
                  </p>
                  {(r.status === "open" || r.status === "reviewing") && (
                    <ReportActions
                      reportId={r.id}
                      targetType={r.target_type}
                      targetId={r.target_id}
                    />
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </>
  );
}
