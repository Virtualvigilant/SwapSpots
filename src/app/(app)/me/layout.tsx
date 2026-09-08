import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentProfile, getUser } from "@/lib/queries/session";
import { avatarUrl } from "@/lib/images";
import { PageHeader } from "@/components/ui/page-header";
import { AccountNav } from "@/components/layout/account-nav";
import { Avatar } from "@/components/ui/avatar";
import { buttonClasses } from "@/components/ui/button";

export default async function AccountLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getUser();
  if (!user) redirect("/sign-in?next=/me/listings");

  const profile = await getCurrentProfile();

  // An auth user with no profile row has not finished onboarding. Settings is
  // the one page that can fix that, so it is allowed through.
  if (!profile) {
    return (
      <>
        <PageHeader title="Finish setting up" crumbs={[{ label: "Account" }]} />
        <div className="container-page py-8">{children}</div>
      </>
    );
  }

  return (
    <>
      <PageHeader
        title="Your account"
        crumbs={[{ label: "Account" }]}
        action={
          <div className="flex items-center gap-3">
            <Link
              href={`/u/${profile.username}`}
              className={buttonClasses("outline", "md")}
            >
              View public profile
            </Link>
            <Avatar
              src={avatarUrl(profile.avatar_url)}
              name={profile.full_name}
              size={44}
              verified={profile.verification_status === "verified"}
            />
          </div>
        }
      />

      <div className="container-page grid gap-8 py-8 lg:grid-cols-[220px_minmax(0,1fr)]">
        <AccountNav />
        <div>{children}</div>
      </div>
    </>
  );
}
