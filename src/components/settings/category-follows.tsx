"use client";

import { useOptimistic, useTransition } from "react";
import { toggleCategorySubscription } from "@/lib/actions/profile";
import type { CategorySummary } from "@/lib/queries/categories";
import { FormSection } from "@/components/ui/field";

/**
 * §5.7 — the growth loop for the request board. Sellers follow a category and
 * get pinged the moment a matching request lands, which is what gets requests
 * their first bid inside half an hour instead of never.
 */
export function CategoryFollows({
  categories,
  followed,
}: {
  categories: CategorySummary[];
  followed: string[];
}) {
  const [pending, startTransition] = useTransition();
  const [optimistic, setOptimistic] = useOptimistic(new Set(followed));

  return (
    <FormSection
      title="Category alerts"
      description="Follow a category and we ping you the moment a matching request is posted. This is how sellers get to bids first."
    >
      <ul className="grid gap-2.5 sm:grid-cols-2">
        {categories.map((c) => {
          const on = optimistic.has(c.id);
          return (
            <li key={c.id}>
              <label className="flex cursor-pointer items-center gap-2.5 rounded-xl border border-line px-3.5 py-2.5 text-[13px] text-ink-700">
                <input
                  type="checkbox"
                  checked={on}
                  disabled={pending}
                  onChange={() =>
                    startTransition(async () => {
                      setOptimistic((current) => {
                        const next = new Set(current);
                        if (on) next.delete(c.id);
                        else next.add(c.id);
                        return next;
                      });
                      await toggleCategorySubscription(c.id, on);
                    })
                  }
                  className="size-4 rounded border-line accent-[var(--color-brand)]"
                />
                {c.name}
              </label>
            </li>
          );
        })}
      </ul>
    </FormSection>
  );
}
