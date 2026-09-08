import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getFavorites } from "@/lib/queries/listings";
import { getCurrentProfile } from "@/lib/queries/session";
import { SectionLead } from "@/components/ui/section-lead";
import { ListingGrid } from "@/components/browse/listing-grid";

export const metadata: Metadata = { title: "Saved listings" };

export default async function FavoritesPage() {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/me/settings");

  const saved = await getFavorites(profile.id);
  const savedIds = new Set(saved.map((l) => l.id));

  return (
    <>
      <SectionLead
        title="Saved listings"
        lead="Things you tapped the heart on. Saved listings that expire drop off this list, so what is here is still live."
      />

      <ListingGrid
        listings={saved}
        savedIds={savedIds}
        signedIn
        emptyTitle="Nothing saved yet"
        emptyBody="Tap the heart on any listing to keep it here."
      />
    </>
  );
}
