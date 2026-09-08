"use client";

import Link from "next/link";
import { useActionState } from "react";
import { signUp } from "@/lib/actions/auth";
import { Field, Input } from "@/components/ui/field";
import { SubmitButton } from "@/components/ui/submit-button";
import { FormStatus, FieldError } from "@/components/ui/form-status";

export function SignUpForm() {
  const [state, action] = useActionState(signUp, null);

  return (
    <form action={action} className="mt-8 space-y-5">
      <FormStatus state={state} />

      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Full name" required>
          <Input
            name="fullName"
            required
            placeholder="Wanjiku Mwangi"
            autoComplete="name"
          />
          <FieldError state={state} name="fullName" />
        </Field>
        <Field label="Username" required hint="Lowercase, 3–20 characters">
          <Input
            name="username"
            required
            placeholder="wanjiku_m"
            autoComplete="username"
          />
          <FieldError state={state} name="username" />
        </Field>
      </div>

      <Field label="Student email" required>
        <Input
          type="email"
          name="email"
          required
          placeholder="you@kabarak.ac.ke"
          autoComplete="email"
        />
        <FieldError state={state} name="email" />
      </Field>

      <Field
        label="WhatsApp number"
        required
        hint="Never shown on your listings. Only revealed when a buyer taps Contact."
      >
        <Input
          type="tel"
          name="phone"
          required
          placeholder="0712 345 678"
          autoComplete="tel"
        />
        <FieldError state={state} name="phone" />
      </Field>

      <Field label="Password" required hint="At least 8 characters">
        <Input
          type="password"
          name="password"
          required
          placeholder="••••••••"
          autoComplete="new-password"
        />
        <FieldError state={state} name="password" />
      </Field>

      <div>
        <label className="flex items-start gap-2.5 text-[12.5px] leading-relaxed text-ink-500">
          <input
            type="checkbox"
            name="terms"
            required
            className="mt-0.5 size-4 shrink-0 rounded border-line accent-[var(--color-brand)]"
          />
          <span>
            I agree to the{" "}
            <Link href="/terms" className="font-semibold text-brand hover:underline">
              terms
            </Link>{" "}
            and the{" "}
            <Link
              href="/prohibited-items"
              className="font-semibold text-brand hover:underline"
            >
              prohibited items policy
            </Link>
            .
          </span>
        </label>
        <FieldError state={state} name="terms" />
      </div>

      <SubmitButton size="lg" className="w-full" pendingLabel="Creating…">
        Create account
      </SubmitButton>
    </form>
  );
}
