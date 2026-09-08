import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Shapes } from "lucide-react";
import { getCategories } from "@/lib/queries/categories";
import { categoryArt } from "@/lib/category-art";
import { PageHeader } from "@/components/ui/page-header";

export const metadata: Metadata = {
  title: "Categories",
  description: "Every category on SwapSpot, ordered by campus demand.",
};

export default async function CategoriesPage() {
  const categories = await getCategories();

  return (
    <>
      <PageHeader
        title="Categories"
        lead="Chosen because they are where campus demand actually is. We add new ones by watching what keeps landing in Others."
        crumbs={[{ label: "Categories" }]}
      />

      <div className="container-page py-8">
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {categories.map((c) => {
            const art = categoryArt(c.slug);
            return (
              <li key={c.slug}>
                <Link
                  href={`/browse/${c.slug}`}
                  className="group flex h-full flex-col overflow-hidden rounded-2xl border border-line bg-white transition-shadow hover:shadow-[var(--shadow-soft)]"
                >
                  <div className="relative aspect-[16/9] overflow-hidden bg-surface">
                    {art ? (
                      <Image
                        src={art}
                        alt=""
                        fill
                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 380px"
                        className="object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                    ) : (
                      <span className="grid size-full place-items-center bg-brand-50 text-brand">
                        <Shapes className="size-8" strokeWidth={1.5} />
                      </span>
                    )}
                  </div>
                  <div className="flex flex-1 flex-col p-5">
                    <div className="flex items-start justify-between gap-3">
                      <h2 className="font-display text-[16px] font-bold text-ink">
                        {c.name}
                      </h2>
                      <span className="shrink-0 rounded-md bg-surface px-2 py-1 text-[10.5px] font-bold text-ink-500">
                        {c.count}
                      </span>
                    </div>
                    {c.blurb && (
                      <p className="mt-2 flex-1 text-[12.5px] leading-relaxed text-ink-500">
                        {c.blurb}
                      </p>
                    )}
                    <span className="mt-4 flex items-center gap-1.5 text-[12.5px] font-semibold text-brand">
                      Browse {c.name}
                      <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" />
                    </span>
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
    </>
  );
}
