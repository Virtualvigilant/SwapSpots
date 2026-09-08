"use client";

import Link from "next/link";
import { useActionState } from "react";
import { createRequest } from "@/lib/actions/requests";
import type { CategorySummary } from "@/lib/queries/categories";
import { requestDurations } from "@/lib/constants";
import {
  Field,
  Input,
  Textarea,
  Select,
  FormSection,
} from "@/components/ui/field";
import { SubmitButton } from "@/components/ui/submit-button";
import { FormStatus, FieldError } from "@/components/ui/form-status";
import { buttonClasses } from "@/components/ui/button";

export function RequestForm({
  categories,
  defaultCategory,
}: {
  categories: CategorySummary[];
  defaultCategory?: string;
}) {
  const [state, action] = useActionState(createRequest, null);

  return (
    <form action={action} className="space-y-4">
      <FormStatus state={state} />

      <FormSection
        title="What do you need?"
        description="Be specific. “Mini fridge under 90L” gets useful bids; “fridge” does not."
      >
        <Field label="Title" required hint="3–80 characters">
          <Input
            name="title"
            required
            maxLength={80}
            placeholder="Mini fridge for hostel room"
          />
          <FieldError state={state} name="title" />
        </Field>

        <Field label="Category" required>
          <Select
            name="categoryId"
            defaultValue={defaultCategory}
            options={categories.map((c) => ({ value: c.id, label: c.name }))}
          />
          <FieldError state={state} name="categoryId" />
        </Field>

        <Field
          label="Description"
          required
          hint="Size, condition, colour — anything that changes the price."
        >
          <Textarea
            name="description"
            rows={6}
            required
            maxLength={1500}
            placeholder="Looking for a small fridge, ideally under 90 litres so it fits under the desk…"
          />
          <FieldError state={state} name="description" />
        </Field>
      </FormSection>

      <FormSection
        title="Budget and timing"
        description="A range gets better bids than leaving it open — sellers self-select out."
      >
        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Minimum (KES)">
            <Input type="number" name="budgetMin" placeholder="6000" min={0} />
            <FieldError state={state} name="budgetMin" />
          </Field>
          <Field label="Maximum (KES)">
            <Input type="number" name="budgetMax" placeholder="9000" min={0} />
            <FieldError state={state} name="budgetMax" />
          </Field>
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Needed by">
            <Input type="date" name="neededBy" />
          </Field>
          <Field label="Bidding closes after" required>
            <Select
              name="durationHours"
              defaultValue="48"
              options={requestDurations}
            />
            <FieldError state={state} name="durationHours" />
          </Field>
        </div>
      </FormSection>

      <div className="flex flex-wrap gap-3">
        <SubmitButton size="lg" pendingLabel="Posting…">
          Post request
        </SubmitButton>
        <Link href="/requests" className={buttonClasses("outline", "lg")}>
          Cancel
        </Link>
      </div>
    </form>
  );
}
