import type { Metadata } from "next";
import Link from "next/link";
import { Info, ShieldCheck } from "lucide-react";
import { getVerifications } from "@/lib/queries/admin";
import { timeAgo } from "@/lib/format";
import { avatarUrl } from "@/lib/images";
import { SectionLead } from "@/components/ui/section-lead";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { VerificationActions } from "@/components/admin/verification-actions";

export const metadata: Metadata = { title: "Verifications" };

export default async function AdminVerificationsPage() {
  const verifications = await getVerifications();
  const pending = verifications.filter((v) => v.status === "pending");

  return (
    <>
      <SectionLead
        title="Student verification"
        lead={`${pending.length} waiting on a decision. Review by hand — at launch volume this is faster, more accurate, and puts you in contact with early users. Note that submissions are currently closed, so this queue only holds anything sent before the gate came off.`}
      />

      <div className="mb-6 rounded-2xl border border-line bg-white p-5">
        <p className="flex items-center gap-2 text-[12.5px] font-bold text-ink">
          <Info className="size-4 text-brand" />
          What is stored
        </p>
        <p className="mt-2 max-w-[76ch] text-[12.5px] leading-relaxed text-ink-500">
          Only a SHA-256 hash of the admission number is retained, which is enough
          to enforce uniqueness without holding the raw value. The ID photo is
          deleted from the private bucket 30 days after a decision by a scheduled
          job, and opens through a 60-second signed URL — do not download or copy
          it anywhere else.
        </p>
      </div>

      {verifications.length === 0 ? (
        <EmptyState
          icon={<ShieldCheck className="size-5" />}
          title="No submissions yet"
          body="Verification is switched off as a gate — anyone can list, request and bid without it, and the submission form is not mounted. This queue and everything behind it still work, so approving someone here still gives them the badge."
        />
      ) : (
        <ul className="space-y-3">
          {verifications.map((v) => {
            const p = v.profiles;
            return (
              <li key={v.id} className="rounded-2xl border border-line bg-white p-5">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div className="flex min-w-0 items-center gap-3.5">
                    <Avatar
                      src={avatarUrl(p?.avatar_url)}
                      name={p?.full_name ?? "Unknown"}
                      size={44}
                      verified={p?.verification_status === "verified"}
                    />
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <Link
                          href={`/u/${p?.username ?? ""}`}
                          className="truncate text-[14px] font-bold text-ink hover:text-brand"
                        >
                          {p?.full_name ?? "Unknown"}
                        </Link>
                        <Badge
                          tone={
                            v.status === "pending"
                              ? "info"
                              : v.status === "verified"
                                ? "success"
                                : "danger"
                          }
                        >
                          {v.status}
                        </Badge>
                      </div>
                      <p className="mt-0.5 text-[11.5px] text-ink-400">
                        @{p?.username} · submitted {timeAgo(v.created_at)}
                      </p>
                    </div>
                  </div>

                  <VerificationActions
                    requestId={v.id}
                    imagePath={v.id_image_path}
                    pending={v.status === "pending"}
                  />
                </div>

                {v.rejection_reason && (
                  <p className="mt-3 rounded-xl bg-surface px-3.5 py-2.5 text-[12.5px] leading-relaxed text-ink-500">
                    {v.rejection_reason}
                  </p>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </>
  );
}
