import { getCategories } from "@/lib/queries/categories";
import { getCurrentProfile } from "@/lib/queries/session";
import { getUnreadCount } from "@/lib/queries/notifications";
import { avatarUrl } from "@/lib/images";
import { RealtimeRefresh } from "@/components/shared/realtime-refresh";
import { AnnouncementBar } from "./announcement-bar";
import { SiteHeader } from "./site-header";
import { SiteFooter } from "./site-footer";

/**
 * The standard chrome wrapped around every public and signed-in page.
 *
 * Session and category data are fetched here, on the server, and handed to the
 * header as props — the header itself is a client island only because of the
 * dropdown and the mobile drawer.
 */
export async function Shell({ children }: { children: React.ReactNode }) {
  const [categories, profile] = await Promise.all([
    getCategories(),
    getCurrentProfile(),
  ]);

  // Notifications are RLS-scoped to the caller, so this is 0 when signed out.
  const unread = profile ? await getUnreadCount() : 0;

  return (
    <>
      {/* §9.4: notifications filtered to this user — powers the bell badge. */}
      {profile && (
        <RealtimeRefresh
          table="notifications"
          filter={`user_id=eq.${profile.id}`}
          event="INSERT"
        />
      )}
      <AnnouncementBar />
      <SiteHeader
        categories={categories.map((c) => ({
          slug: c.slug,
          name: c.name,
          count: c.count,
        }))}
        unread={unread}
        account={
          profile
            ? {
                username: profile.username,
                fullName: profile.full_name,
                avatar: avatarUrl(profile.avatar_url),
                verified: profile.verification_status === "verified",
                staff:
                  profile.role === "moderator" || profile.role === "admin",
              }
            : null
        }
      />
      <main className="min-h-[60vh]">{children}</main>
      <SiteFooter categories={categories} />
    </>
  );
}
