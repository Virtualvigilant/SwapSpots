"use client";

import { useActionState } from "react";
import { placeBid, updateBid } from "@/lib/actions/bids";
import { availabilityOptions } from "@/lib/constants";
import { kes } from "@/lib/format";
import { Field, Input, Textarea, Select } from "@/components/ui/field";
import { SubmitButton } from "@/components/ui/submit-button";
import { FormStatus, FieldError } from "@/components/ui/form-status";

export type ExistingBid = {
  id: string;
  amount: number;
  message: string | null;
  availability: string | null;
  status: string;
};

/**
 * One bid per person (§5.2), so this form is either "place" or "edit" — never
 * a second insert. Editing stays open until the requester awards.
 */
export function BidForm({
  requestId,
  existing,
}: {
  requestId: string;
  existing: ExistingBid | null;
}) {
  const editing = Boolean(existing && existing.status === "pending");
  const [state, action] = useActionState(
    editing ? updateBid : placeBid,
    null,
  );

  if (existing && existing.status !== "pending") {
    return (
      <p className="text-[12.5px] leading-relaxed text-ink-500">
        Your bid of {kes(existing.amount)} is {existing.status}. It can no longer
        be edited.
      </p>
    );
  }

  return (
    <form action={action} className="mt-5 space-y-4">
      <input type="hidden" name="requestId" value={requestId} />
      {editing && <input type="hidden" name="bidId" value={existing!.id} />}

      <FormStatus state={state} />

      <Field label="Your price (KES)" required>
        <Input
          type="number"
          name="amount"
          min={0}
          step={1}
          required
          defaultValue={existing?.amount ?? ""}
          placeholder="7200"
        />
        <FieldError state={state} name="amount" />
      </Field>

      <Field label="When can you deliver?" required>
        <Select
          name="availability"
          defaultValue={existing?.availability ?? availabilityOptions[0]}
          options={availabilityOptions.map((a) => ({ value: a, label: a }))}
        />
      </Field>

      <Field label="Message" hint="What exactly are you offering?">
        <Textarea
          name="message"
          rows={4}
          defaultValue={existing?.message ?? ""}
          placeholder="Describe the item and its condition."
        />
        <FieldError state={state} name="message" />
      </Field>

      <SubmitButton className="w-full" pendingLabel="Placing…">
        {editing ? "Update bid" : "Place bid"}
      </SubmitButton>
    </form>
  );
}
