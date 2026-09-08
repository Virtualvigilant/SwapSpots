"use client";

import { useActionState, useState } from "react";
import { Flag } from "lucide-react";
import { createReport } from "@/lib/actions/reports";
import { Field, Select, Textarea } from "@/components/ui/field";
import { SubmitButton } from "@/components/ui/submit-button";
import { FormStatus } from "@/components/ui/form-status";
import type { Database } from "@/types/database";

/** §5.8 mechanism 2 — reporting sits on every listing, request, bid and profile. */
const REASONS = [
  "Prohibited item",
  "Academic dishonesty",
  "Suspected scam",
  "Wrong category",
  "Abusive language",
  "Spam",
  "Something else",
];

export function ReportButton({
  targetType,
  targetId,
}: {
  targetType: Database["public"]["Enums"]["report_target"];
  targetId: string;
}) {
  const [open, setOpen] = useState(false);
  const [state, action] = useActionState(createReport, null);

  if (state?.ok) {
    return (
      <div className="rounded-2xl border border-line bg-white p-5">
        <FormStatus state={state} />
      </div>
    );
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex w-full items-center justify-center gap-2 rounded-2xl border border-line bg-white px-4 py-3 text-[12.5px] font-semibold text-ink-500 transition-colors hover:border-red-200 hover:text-red-600"
      >
        <Flag className="size-3.5" />
        Report this
      </button>
    );
  }

  return (
    <form action={action} className="space-y-4 rounded-2xl border border-line bg-white p-5">
      <input type="hidden" name="targetType" value={targetType} />
      <input type="hidden" name="targetId" value={targetId} />

      <p className="font-display text-[14px] font-bold text-ink">Report this</p>
      <FormStatus state={state} />

      <Field label="Reason" required>
        <Select
          name="reason"
          options={REASONS.map((r) => ({ value: r, label: r }))}
        />
      </Field>

      <Field label="Anything else?" hint="Optional, but it speeds up the review.">
        <Textarea name="details" rows={3} />
      </Field>

      <div className="flex gap-2">
        <SubmitButton size="sm" variant="dark" className="flex-1">
          Send report
        </SubmitButton>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="rounded-lg px-3 text-[12.5px] font-semibold text-ink-500 hover:text-ink"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
