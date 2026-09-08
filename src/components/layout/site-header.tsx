"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Bell, ChevronDown, Heart, Menu, Search, User, X } from "lucide-react";
import { primaryNav } from "@/lib/site";
import { Avatar } from "@/components/ui/avatar";
import { SignOutButton } from "./sign-out-button";
import { Logo } from "./logo";

const ICON = "size-[19px]";

export type HeaderAccount = {
  username: string;
  fullName: string;
  avatar: string | null;
  verified: boolean;
  staff: boolean;
};

export function SiteHeader({
  categories,
  unread,
  account,
}: {
  categories: { slug: string; name: string; count: number }[];
  unread: number;
  account: HeaderAccount | null;
}) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [catsOpen, setCatsOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);

  /** "/" only matches exactly; every other item matches its whole subtree. */
  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  return (
    <header className="sticky top-0 z-50 border-b border-line/70 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/80">
      <div className="container-page flex h-[68px] items-center justify-between gap-4">
        {/* left: burger (mobile) + wordmark */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setMobileOpen((v) => !v)}
            aria-label="Toggle menu"
            aria-expanded={mobileOpen}
            className="-ml-1 grid size-9 place-items-center rounded-lg text-ink lg:hidden"
          >
            {mobileOpen ? <X className="size-5" /> : <Menu className="size-5" />}
          </button>
          <Logo />
        </div>

        {/* centre: primary nav */}
        <nav className="hidden items-center gap-7 lg:flex">
          {primaryNav.map((item) => {
            const active = isActive(item.href);
            return (
              <div
                key={item.label}
                className="relative"
                onMouseEnter={() => item.hasMenu && setCatsOpen(true)}
                onMouseLeave={() => item.hasMenu && setCatsOpen(false)}
              >
                <Link
                  href={item.href}
                  className={`relative flex items-center gap-1 py-6 text-[14px] transition-colors ${
                    active
                      ? "font-semibold text-brand"
                      : "font-medium text-ink-700 hover:text-brand"
                  }`}
                >
                  {item.label}
                  {item.hasMenu && (
                    <ChevronDown
                      className={`size-3.5 transition-transform ${catsOpen ? "rotate-180" : ""}`}
                      strokeWidth={2.4}
                    />
                  )}
                  {active && (
                    <span className="absolute inset-x-0 bottom-4 mx-auto h-[2.5px] w-5 rounded-full bg-brand" />
                  )}
                </Link>

                {item.hasMenu && catsOpen && categories.length > 0 && (
                  <div className="absolute left-1/2 top-full z-50 w-[300px] -translate-x-1/2 rounded-2xl border border-line bg-white p-2 shadow-[var(--shadow-float)]">
                    <ul className="grid grid-cols-1">
                      {categories.map((c) => (
                        <li key={c.slug}>
                          <Link
                            href={`/browse/${c.slug}`}
                            className="flex items-center justify-between rounded-xl px-3 py-2.5 text-[13px] font-medium text-ink-700 hover:bg-surface hover:text-ink"
                          >
                            {c.name}
                            <span className="text-[11px] font-normal text-ink-400">
                              {c.count}
                            </span>
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            );
          })}
        </nav>

        {/* right: utility icons */}
        <div className="flex items-center gap-1 sm:gap-2">
          <Link
            href="/search"
            aria-label="Search listings"
            className="grid size-9 place-items-center rounded-full text-ink-700 transition-colors hover:bg-surface hover:text-ink"
          >
            <Search className={ICON} strokeWidth={1.9} />
          </Link>

          {account ? (
            <>
              <Link
                href="/me/favorites"
                aria-label="Saved listings"
                className="hidden size-9 place-items-center rounded-full text-ink-700 transition-colors hover:bg-surface hover:text-ink sm:grid"
              >
                <Heart className={ICON} strokeWidth={1.9} />
              </Link>

              <Link
                href="/me/notifications"
                aria-label={`Notifications, ${unread} unread`}
                className="relative grid size-9 place-items-center rounded-full text-ink-700 transition-colors hover:bg-surface hover:text-ink"
              >
                <Bell className={ICON} strokeWidth={1.9} />
                {unread > 0 && (
                  <span className="absolute right-0.5 top-0.5 grid size-[17px] place-items-center rounded-full bg-brand text-[10px] font-bold leading-none text-white ring-2 ring-white">
                    {unread > 9 ? "9+" : unread}
                  </span>
                )}
              </Link>

              <div
                className="relative"
                onMouseEnter={() => setAccountOpen(true)}
                onMouseLeave={() => setAccountOpen(false)}
              >
                <button
                  type="button"
                  onClick={() => setAccountOpen((v) => !v)}
                  aria-label="Your account"
                  aria-expanded={accountOpen}
                  className="grid place-items-center rounded-full"
                >
                  <Avatar
                    src={account.avatar}
                    name={account.fullName}
                    size={32}
                    verified={account.verified}
                  />
                </button>

                {accountOpen && (
                  <div className="absolute right-0 top-full z-50 w-[210px] rounded-2xl border border-line bg-white p-2 shadow-[var(--shadow-float)]">
                    <p className="truncate px-3 pb-2 pt-1 text-[12px] text-ink-400">
                      @{account.username}
                    </p>
                    {[
                      { label: "My listings", href: "/me/listings" },
                      { label: "My requests", href: "/me/requests" },
                      { label: "My bids", href: "/me/bids" },
                      { label: "Reviews", href: "/me/reviews" },
                      { label: "Settings", href: "/me/settings" },
                      ...(account.staff
                        ? [{ label: "Moderation", href: "/admin/reports" }]
                        : []),
                    ].map((item) => (
                      <Link
                        key={item.href}
                        href={item.href}
                        className="block rounded-xl px-3 py-2 text-[13px] font-medium text-ink-700 hover:bg-surface hover:text-ink"
                      >
                        {item.label}
                      </Link>
                    ))}
                    <div className="mt-1 border-t border-line pt-2">
                      <SignOutButton className="w-full" />
                    </div>
                  </div>
                )}
              </div>
            </>
          ) : (
            <Link
              href="/sign-in"
              className="flex h-9 items-center gap-1.5 rounded-full px-3 text-[13px] font-semibold text-ink-700 transition-colors hover:bg-surface hover:text-ink"
            >
              <User className={ICON} strokeWidth={1.9} />
              <span className="hidden sm:inline">Sign in</span>
            </Link>
          )}
        </div>
      </div>

      {/* mobile drawer */}
      {mobileOpen && (
        <div className="border-t border-line bg-white lg:hidden">
          <nav className="container-page flex flex-col py-2">
            {primaryNav.map((item) => (
              <Link
                key={item.label}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className={`flex items-center justify-between border-b border-line/60 py-3.5 text-[15px] last:border-0 ${
                  isActive(item.href)
                    ? "font-semibold text-brand"
                    : "font-medium text-ink-700"
                }`}
              >
                {item.label}
                {item.hasMenu && <ChevronDown className="size-4 text-ink-400" />}
              </Link>
            ))}
            {account && (
              <Link
                href="/me/listings"
                onClick={() => setMobileOpen(false)}
                className="flex items-center justify-between border-b border-line/60 py-3.5 text-[15px] font-medium text-ink-700"
              >
                Your account
              </Link>
            )}
            <div className="flex gap-3 py-4">
              <Link
                href="/listings/new"
                onClick={() => setMobileOpen(false)}
                className="flex-1 rounded-xl bg-brand px-4 py-3 text-center text-[14px] font-semibold text-white"
              >
                Post a listing
              </Link>
              <Link
                href="/requests/new"
                onClick={() => setMobileOpen(false)}
                className="flex-1 rounded-xl border border-line px-4 py-3 text-center text-[14px] font-semibold text-ink"
              >
                Post a request
              </Link>
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
