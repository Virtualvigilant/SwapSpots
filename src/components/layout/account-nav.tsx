"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Bell,
  Gavel,
  Heart,
  Package,
  Settings,
  Star,
  Tag,
} from "lucide-react";
import { cn } from "@/lib/cn";

const ITEMS = [
  { label: "My listings", href: "/me/listings", Icon: Package },
  { label: "My requests", href: "/me/requests", Icon: Tag },
  { label: "My bids", href: "/me/bids", Icon: Gavel },
  { label: "Saved", href: "/me/favorites", Icon: Heart },
  { label: "Notifications", href: "/me/notifications", Icon: Bell },
  { label: "Reviews", href: "/me/reviews", Icon: Star },
  { label: "Settings", href: "/me/settings", Icon: Settings },
];

export function AccountNav() {
  const pathname = usePathname();

  return (
    <nav aria-label="Account">
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
                    ? "bg-ink text-white"
                    : "text-ink-700 hover:bg-surface hover:text-ink",
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
