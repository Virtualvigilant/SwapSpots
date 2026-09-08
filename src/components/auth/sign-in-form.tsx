"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { signIn, sendMagicLink } from "@/lib/actions/auth";
import { Field, Input } from "@/components/ui/field";
import { SubmitButton } from "@/components/ui/submit-button";
import { FormStatus, FieldError } from "@/components/ui/form-status";

export function SignInForm({ next }: { next?: string }) {
  const [state, action] = useActionState(signIn, null);
  const [linkState, linkAction] = useActionState(sendMagicLink, null);
  const [mode, setMode] = useState<"password" | "link">("password");

  return (
    <>
      {mode === "password" ? (
        <form action={action} className="mt-8 space-y-5">
          {next && <input type="hidden" name="next" value={next} />}
          <FormStatus state={state} />

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

          <Field label="Password" required>
            <Input
              type="password"
              name="password"
              required
              placeholder="••••••••"
              autoComplete="current-password"
            />
            <FieldError state={state} name="password" />
          </Field>

          <SubmitButton size="lg" className="w-full" pendingLabel="Signing in…">
            Sign in
          </SubmitButton>
        </form>
      ) : (
        <form action={linkAction} className="mt-8 space-y-5">
          <FormStatus state={linkState} />
          <Field
            label="Student email"
            required
            hint="We email you a link that signs you in. No password needed."
          >
            <Input
              type="email"
              name="email"
              required
              placeholder="you@kabarak.ac.ke"
              autoComplete="email"
            />
            <FieldError state={linkState} name="email" />
          </Field>
          <SubmitButton size="lg" className="w-full" pendingLabel="Sending…">
            Email me a sign-in link
          </SubmitButton>
        </form>
      )}

      <div className="my-6 flex items-center gap-3 text-[11.5px] text-ink-400">
        <span className="h-px flex-1 bg-line" />
        or
        <span className="h-px flex-1 bg-line" />
      </div>

      <button
        type="button"
        onClick={() => setMode(mode === "password" ? "link" : "password")}
        className="w-full rounded-xl border border-line bg-white px-6 py-3 text-[14px] font-semibold text-ink transition-colors hover:border-ink-400"
      >
        {mode === "password" ? "Email me a sign-in link" : "Use a password instead"}
      </button>

      <p className="mt-8 text-center text-[13px] text-ink-500">
        New here?{" "}
        <Link href="/sign-up" className="font-semibold text-brand hover:underline">
          Create an account
        </Link>
      </p>
    </>
  );
}
