"use client";

import Link from "next/link";
import { useActionState } from "react";
import { createReportFromUrl } from "@/lib/actions/reports";
import { Field, Input, Textarea, Select } from "@/components/ui/field";
import { SubmitButton } from "@/components/ui/submit-button";
import { FormStatus, FieldError } from "@/components/ui/form-status";

export function ReportPageForm({
  reasons,
  signedIn,
}: {
  reasons: { value: string; label: string }[];
  signedIn: boolean;
}) {
  const [state, action] = useActionState(createReportFromUrl, null);

  if (!signedIn) {
    return (
      <div className="rounded-2xl border border-line bg-white p-6 sm:p-7">
        <p className="text-[14px] font-bold text-ink">Sign in to file a report</p>
        <p className="mt-2 max-w-[52ch] text-[13px] leading-relaxed text-ink-500">
          Reports are attached to an account so moderators can weigh them and so
          bad-faith reporting has a cost. It takes a moment.
        </p>
        <Link
          href="/sign-in?next=/report"
          className="mt-4 inline-block text-[13px] font-semibold text-brand hover:underline"
        >
          Sign in and continue
        </Link>
      </div>
    );
  }

  return (
    <form
      action={action}
      className="rounded-2xl border border-line bg-white p-6 sm:p-7"
    >
      <FormStatus state={state} />

      <div className="mt-4">
        <Field label="Reason" required>
          <Select name="reason" options={reasons} />
        </Field>
      </div>

      <div className="mt-5">
        <Field
          label="Link"
          required
          hint="Paste the address of the listing, request or profile."
        >
          <Input
            name="url"
            required
            placeholder="https://swapspot.co.ke/listings/…"
          />
          <FieldError state={state} name="url" />
        </Field>
      </div>

      <div className="mt-5">
        <Field
          label="What happened?"
          required
          hint="Specifics help. Dates, amounts, what was said."
        >
          <Textarea
            name="detail"
            rows={7}
            required
            placeholder="Describe the problem…"
          />
          <FieldError state={state} name="details" />
        </Field>
      </div>

      <label className="mt-5 flex items-start gap-2.5 text-[12.5px] leading-relaxed text-ink-500">
        <input
          type="checkbox"
          required
          className="mt-0.5 size-4 shrink-0 rounded border-line accent-[var(--color-brand)]"
        />
        I understand that filing reports in bad faith counts against my own
        account.
      </label>

      <SubmitButton size="lg" className="mt-6" pendingLabel="Sending…">
        Submit report
      </SubmitButton>
    </form>
  );
}
