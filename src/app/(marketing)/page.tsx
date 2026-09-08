import { getNewArrivals, getMostContacted, getFavoriteIds } from "@/lib/queries/listings";
import { getCategories } from "@/lib/queries/categories";
import { getPublicStats } from "@/lib/queries/stats";
import { getUser } from "@/lib/queries/session";
import { Hero } from "@/components/home/hero";
import { FeatureStrip } from "@/components/home/feature-strip";
import { CategoryRail } from "@/components/home/category-rail";
import { NewArrivals } from "@/components/home/new-arrivals";
import { TopSellers } from "@/components/home/top-sellers";
import { PromoBanners } from "@/components/home/promo-banners";
import { TrustStrip } from "@/components/home/trust-strip";
import { EmptyMarket } from "@/components/home/empty-market";

export default async function HomePage() {
  const [arrivals, contacted, categories, stats, user] = await Promise.all([
    getNewArrivals(12),
    getMostContacted(3),
    getCategories(),
    getPublicStats(),
    getUser(),
  ]);

  const savedIds = user ? [...(await getFavoriteIds(user.id))] : undefined;

  return (
    <>
      <Hero featured={arrivals} stats={stats} />
      <FeatureStrip />
      {stats.listings === 0 && stats.requests === 0 && <EmptyMarket />}
      <CategoryRail categories={categories} />
      <NewArrivals
        listings={arrivals}
        savedIds={savedIds}
        signedIn={Boolean(user)}
      />
      <TopSellers listings={contacted} />
      <PromoBanners />
      <TrustStrip />
    </>
  );
}
