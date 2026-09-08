import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getUser } from "@/lib/queries/session";
import { SignInForm } from "@/components/auth/sign-in-form";

export const metadata: Metadata = { title: "Sign in" };

export default async function SignInPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const user = await getUser();
  const { next } = await searchParams;

  if (user) redirect(next?.startsWith("/") ? next : "/browse");

  return (
    <div>
      <h1 className="font-display text-[28px] font-extrabold tracking-[-0.035em] text-ink">
        Welcome back
      </h1>
      <p className="mt-2 text-[14px] text-ink-500">
        Sign in to post, bid and reveal seller contacts.
      </p>

      <SignInForm next={next} />
    </div>
  );
}
