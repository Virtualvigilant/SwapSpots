"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BarChart3, Flag, FolderTree, Radar, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/cn";

const ITEMS = [
  { label: "Reports", href: "/admin/reports", Icon: Flag },
  { label: "Verifications", href: "/admin/verifications", Icon: ShieldCheck },
  { label: "Categories", href: "/admin/categories", Icon: FolderTree },
  { label: "Others watch", href: "/admin/others-watch", Icon: Radar },
  { label: "Metrics", href: "/admin/metrics", Icon: BarChart3 },
];

export function AdminNav() {
  const pathname = usePathname();

  return (
    <nav aria-label="Admin">
      <ul className="no-scrollbar flex gap-1.5 overflow-x-auto pb-1 lg:flex-col lg:gap-0.5 lg:overflow-visible lg:pb-0">
        {ITEMS.map(({ label, href, Icon }) => {
          const active = pathname === href;
          return (
            <li key={href}>
              <Link
                href={href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex items-center gap-2.5 whitespace-nowrap rounded-xl px-3.5 py-2.5 text-[13.5px] font-medium transition-colors",
                  active
                    ? "bg-brand text-white"
                    : "text-white/65 hover:bg-white/10 hover:text-white",
                )}
              >
                <Icon className="size-4 shrink-0" strokeWidth={1.9} />
                {label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
