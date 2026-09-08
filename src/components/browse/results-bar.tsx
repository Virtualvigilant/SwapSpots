"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";

/** Sorting rewrites the query string, so a sorted view is linkable. */
export function ResultsBar({
  count,
  label,
  sorts,
}: {
  count: number;
  label: string;
  sorts: { value: string; label: string }[];
}) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const current = params.get("sort") ?? sorts[0].value;

  function onSort(value: string) {
    const next = new URLSearchParams(params.toString());
    if (value === sorts[0].value) next.delete("sort");
    else next.set("sort", value);
    next.delete("page");
    router.push(`${pathname}${next.size ? `?${next}` : ""}`);
  }

  return (
    <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
      <p className="text-[13px] text-ink-500">
        <span className="font-bold text-ink">{count.toLocaleString("en-KE")}</span>{" "}
        {label}
      </p>
      <label className="flex items-center gap-2 text-[12.5px] text-ink-500">
        Sort
        <select
          value={current}
          onChange={(e) => onSort(e.target.value)}
          className="rounded-lg border border-line bg-white px-2.5 py-2 text-[12.5px] font-semibold text-ink outline-none focus:border-brand"
        >
          {sorts.map((s) => (
            <option key={s.value} value={s.value}>
              {s.label}
            </option>
          ))}
        </select>
      </label>
    </div>
  );
}
