import type { Metadata } from "next";
import Image from "next/image";
import { Shapes } from "lucide-react";
import { getAdminCategories } from "@/lib/queries/admin";
import { categoryArt } from "@/lib/category-art";
import { SectionLead } from "@/components/ui/section-lead";
import { Badge } from "@/components/ui/badge";
import { buttonClasses } from "@/components/ui/button";
import {
  CategoryVisibility,
  NewCategoryForm,
} from "@/components/admin/category-actions";
import Link from "next/link";

export const metadata: Metadata = { title: "Categories" };

export default async function AdminCategoriesPage() {
  const categories = await getAdminCategories();

  return (
    <>
      <SectionLead
        title="Categories"
        lead="Seeded and admin-managed. Users never create categories — that is how taxonomies rot. Promote a new one when Others watch shows the same thing arriving over and over."
        action={<NewCategoryForm />}
      />

      <ul className="overflow-hidden rounded-2xl border border-line bg-white">
        {categories.map((c) => {
          const art = categoryArt(c.slug);
          return (
            <li
              key={c.slug}
              className="flex items-center gap-4 border-b border-line px-4 py-3 last:border-0"
            >
              <div className="relative size-11 shrink-0 overflow-hidden rounded-lg bg-surface">
                {art ? (
                  <Image src={art} alt="" fill sizes="44px" className="object-cover" />
                ) : (
                  <span className="grid size-full place-items-center bg-brand-50 text-brand">
                    <Shapes className="size-4" strokeWidth={1.6} />
                  </span>
                )}
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="truncate text-[13.5px] font-bold text-ink">
                    {c.name}
                  </p>
                  {c.is_catchall && <Badge tone="gold">Catch-all</Badge>}
                  {!c.is_active && <Badge tone="muted">Hidden</Badge>}
                </div>
                <p className="mt-0.5 truncate text-[11.5px] text-ink-400">
                  /browse/{c.slug}
                </p>
              </div>

              <p className="shrink-0 text-[12.5px] font-bold text-ink">{c.count}</p>

              <div className="flex shrink-0 gap-2">
                <Link
                  href={`/browse/${c.slug}`}
                  className={buttonClasses("outline", "sm")}
                >
                  View
                </Link>
                <CategoryVisibility id={c.id} isActive={c.is_active} />
              </div>
            </li>
          );
        })}
      </ul>
    </>
  );
}
