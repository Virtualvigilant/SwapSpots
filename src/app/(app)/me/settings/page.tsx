import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AlertTriangle } from "lucide-react";
import { getCurrentProfile, getUser } from "@/lib/queries/session";
import { getCategories } from "@/lib/queries/categories";
import { createClient } from "@/lib/supabase/server";
import { SectionLead } from "@/components/ui/section-lead";
import { ProfileForm } from "@/components/settings/profile-form";
import { OnboardingForm } from "@/components/settings/onboarding-form";
import { CategoryFollows } from "@/components/settings/category-follows";
import { SignOutButton } from "@/components/layout/sign-out-button";

export const metadata: Metadata = { title: "Settings" };

export default async function SettingsPage() {
  const user = await getUser();
  if (!user) redirect("/sign-in?next=/me/settings");

  const profile = await getCurrentProfile();
  if (!profile) return <OnboardingForm />;

  const supabase = await createClient();
  const [categories, { data: follows }] = await Promise.all([
    getCategories(),
    supabase
      .from("category_subscriptions")
      .select("category_id")
      .eq("user_id", profile.id),
  ]);

  return (
    <>
      <SectionLead
        title="Settings"
        lead="Your profile, how people reach you, and what we are allowed to notify you about."
      />

      <ProfileForm profile={profile} email={user.email ?? ""} />

      <div className="mt-4">
        <CategoryFollows
          categories={categories}
          followed={(follows ?? []).map((f) => f.category_id)}
        />
      </div>

      <section className="mt-8 rounded-2xl border border-line bg-white p-5 sm:p-6">
        <h2 className="font-display text-[16px] font-bold text-ink">Session</h2>
        <p className="mt-2 text-[12.5px] leading-relaxed text-ink-500">
          Signing out clears the session cookie on this device only.
        </p>
        <div className="mt-4">
          <SignOutButton />
        </div>
      </section>

      <section className="mt-4 rounded-2xl border border-red-200 bg-red-50/50 p-5 sm:p-6">
        <h2 className="flex items-center gap-2 font-display text-[16px] font-bold text-red-700">
          <AlertTriangle className="size-4" />
          Delete account
        </h2>
        <p className="mt-2 max-w-[62ch] text-[12.5px] leading-relaxed text-red-700/75">
          Removes your profile, listings and requests. Reviews you wrote about
          other people stay, anonymised — otherwise deleting an account would be a
          way to erase a bad reputation you handed out. Email us and we will do it
          by hand within 30 days; self-service deletion needs the service role and
          is not wired up yet.
        </p>
      </section>
    </>
  );
}
