import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Shapes } from "lucide-react";
import type { CategorySummary } from "@/lib/queries/categories";
import { categoryArt } from "@/lib/category-art";
import { SectionHead } from "@/components/ui/section-head";

export function CategoryRail({
  categories,
}: {
  categories: CategorySummary[];
}) {
  if (categories.length === 0) return null;

  return (
    <section className="bg-white py-10">
      <div className="container-page">
        <SectionHead
          title="Shop by Categories"
          href="/categories"
          linkLabel="View All Categories"
        />

        <ul className="grid grid-cols-2 gap-3.5 sm:grid-cols-3 lg:grid-cols-4">
          {categories.map((c) => {
            const art = categoryArt(c.slug);
            return (
              <li key={c.slug}>
                <Link
                  href={`/browse/${c.slug}`}
                  className="group block overflow-hidden rounded-2xl border border-line bg-surface transition-shadow hover:shadow-[var(--shadow-soft)]"
                >
                  <div className="relative aspect-[4/3] overflow-hidden">
                    {art ? (
                      <Image
                        src={art}
                        alt=""
                        fill
                        sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 300px"
                        className="object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                    ) : (
                      <span className="grid size-full place-items-center bg-brand-50 text-brand">
                        <Shapes className="size-7" strokeWidth={1.5} />
                      </span>
                    )}
                  </div>
                  <div className="flex items-center justify-between gap-2 px-3.5 py-3">
                    <div className="min-w-0">
                      <p className="truncate text-[13px] font-bold text-ink">
                        {c.name}
                      </p>
                      <p className="mt-0.5 text-[11.5px] text-ink-500">
                        {c.count} live {c.count === 1 ? "listing" : "listings"}
                      </p>
                    </div>
                    <span className="grid size-7 shrink-0 place-items-center rounded-full border border-line bg-white text-ink transition-colors group-hover:border-brand group-hover:bg-brand group-hover:text-white">
                      <ArrowRight className="size-3.5" strokeWidth={2.2} />
                    </span>
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
