import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getUser } from "@/lib/queries/session";
import { SignUpForm } from "@/components/auth/sign-up-form";

export const metadata: Metadata = { title: "Create an account" };

export default async function SignUpPage() {
  const user = await getUser();
  if (user) redirect("/browse");

  return (
    <div>
      <h1 className="font-display text-[28px] font-extrabold tracking-[-0.035em] text-ink">
        Create your account
      </h1>
      <p className="mt-2 text-[14px] text-ink-500">
        One account buys and sells. There is no separate seller signup.
      </p>

      <SignUpForm />

      <p className="mt-6 rounded-xl border border-line bg-surface px-4 py-3 text-[12px] leading-relaxed text-ink-500">
        You can list, request and bid straight away — there is nothing to verify
        and nothing to wait for. Just keep to the{" "}
        <Link
          href="/prohibited-items"
          className="font-semibold text-brand hover:underline"
        >
          prohibited items policy
        </Link>
        .
      </p>

      <p className="mt-6 text-center text-[13px] text-ink-500">
        Already have an account?{" "}
        <Link href="/sign-in" className="font-semibold text-brand hover:underline">
          Sign in
        </Link>
      </p>
    </div>
  );
}
