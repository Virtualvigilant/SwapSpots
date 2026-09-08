"use client";

import { useActionState } from "react";
import { completeOnboarding } from "@/lib/actions/profile";
import { pickupAreas } from "@/lib/constants";
import { Field, Input, Select, FormSection } from "@/components/ui/field";
import { SubmitButton } from "@/components/ui/submit-button";
import { FormStatus, FieldError } from "@/components/ui/form-status";

/**
 * Shown when an auth user exists but the profile row does not — a magic-link or
 * OAuth signup that never carried a username or phone number.
 */
export function OnboardingForm() {
  const [state, action] = useActionState(completeOnboarding, null);

  return (
    <form action={action} className="mx-auto max-w-[560px] space-y-4">
      <FormStatus state={state} />

      <FormSection
        title="Finish your profile"
        description="One account buys and sells. We need a name people can recognise and a number for the WhatsApp handoff — the number is never shown on a page."
      >
        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Full name" required>
            <Input name="fullName" required placeholder="Wanjiku Mwangi" />
            <FieldError state={state} name="fullName" />
          </Field>
          <Field label="Username" required hint="Lowercase, 3–20 characters">
            <Input name="username" required placeholder="wanjiku_m" />
            <FieldError state={state} name="username" />
          </Field>
        </div>

        <Field label="WhatsApp number" required hint="0712 345 678">
          <Input type="tel" name="phone" required autoComplete="tel" />
          <FieldError state={state} name="phone" />
        </Field>

        <Field label="Usual pickup area">
          <Select
            name="pickupArea"
            options={pickupAreas.map((a) => ({ value: a, label: a }))}
          />
        </Field>
      </FormSection>

      <SubmitButton size="lg" className="w-full" pendingLabel="Saving…">
        Finish setting up
      </SubmitButton>
    </form>
  );
}
