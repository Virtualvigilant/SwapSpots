import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Info } from "lucide-react";
import { getCurrentProfile } from "@/lib/queries/session";
import { getCategories } from "@/lib/queries/categories";
import { getMyRequests } from "@/lib/queries/requests";
import { caps } from "@/lib/constants";
import { PageHeader } from "@/components/ui/page-header";
import { RequestForm } from "@/components/requests/request-form";

export const metadata: Metadata = { title: "Post a request" };

export default async function NewRequestPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string }>;
}) {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/sign-in?next=/requests/new");

  const { category } = await searchParams;
  const [categories, mine] = await Promise.all([
    getCategories(),
    getMyRequests(profile.id),
  ]);

  const dayAgo = Date.now() - 86_400_000;
  const today = mine.filter(
    (r) => new Date(r.created_at).getTime() > dayAgo,
  ).length;

  const defaultCategory = category
    ? categories.find((c) => c.slug === category)?.id
    : undefined;

  return (
    <>
      <PageHeader
        title="Post a request"
        lead="Describe what you need. Sellers who follow the category are notified straight away and bid against each other."
        crumbs={[{ label: "Requests", href: "/requests" }, { label: "New" }]}
      />

      <div className="container-page grid gap-8 py-8 lg:grid-cols-[minmax(0,1fr)_300px]">
        {today >= caps.requests ? (
          <div className="rounded-2xl border border-line bg-white p-6">
            <p className="font-display text-[16px] font-bold text-ink">
              You have hit today&rsquo;s request limit
            </p>
            <p className="mt-2 max-w-[52ch] text-[13px] leading-relaxed text-ink-500">
              {today} of {caps.requests} in the last 24 hours. Try again tomorrow.
            </p>
          </div>
        ) : (
          <RequestForm
            categories={categories}
            defaultCategory={defaultCategory}
          />
        )}

        <aside className="space-y-4">
          <div className="rounded-2xl border border-line bg-surface p-5">
            <p className="flex items-center gap-2 text-[12.5px] font-bold text-ink">
              <Info className="size-4 text-brand" />
              Before you post
            </p>
            <ul className="mt-3 space-y-2.5 text-[12.5px] leading-relaxed text-ink-500">
              <li>Bids are public — everyone sees each amount and who placed it.</li>
              <li>You cannot bid on your own request.</li>
              <li>Awarding is final and notifies every other bidder.</li>
              <li>Unawarded requests close automatically when the timer ends.</li>
            </ul>
          </div>

          <div className="rounded-2xl border border-line bg-white p-5">
            <p className="text-[11.5px] font-bold uppercase tracking-[0.1em] text-ink-400">
              Your limits
            </p>
            <dl className="mt-3 space-y-2 text-[12.5px]">
              <div className="flex justify-between">
                <dt className="text-ink-500">Requests today</dt>
                <dd className="font-bold text-ink">
                  {today} of {caps.requests}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-ink-500">Bids today</dt>
                <dd className="font-bold text-ink">up to {caps.bids}</dd>
              </div>
            </dl>
            <p className="mt-3 text-[11.5px] leading-relaxed text-ink-400">
              The daily limits exist to stop one account flooding the board. They
              reset on a rolling 24 hours.
            </p>
          </div>
        </aside>
      </div>
    </>
  );
}
