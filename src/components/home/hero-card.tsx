import Image from "next/image";
import Link from "next/link";
import { priceLabel } from "@/lib/format";
import type { Database } from "@/types/database";

/**
 * One of the small white product cards that float over the hero visual.
 * `className` carries the absolute positioning so the caller owns the layout.
 */
export function HeroCard({
  title,
  price,
  priceType,
  image,
  href,
  className = "",
  delay = "0s",
}: {
  title: string;
  price: number;
  priceType: Database["public"]["Enums"]["price_type"];
  image: string;
  href: string;
  className?: string;
  delay?: string;
}) {
  return (
    <Link
      href={href}
      className={`animate-floaty absolute w-[96px] rounded-xl bg-white p-1.5 shadow-[var(--shadow-float)] sm:w-[130px] sm:rounded-2xl sm:p-2.5 lg:w-[152px] ${className}`}
      style={{ animationDelay: delay }}
    >
      <div className="relative aspect-square overflow-hidden rounded-xl bg-surface">
        <Image src={image} alt="" fill sizes="152px" className="object-cover" />
      </div>
      <span className="block px-0.5 pb-0.5 pt-2">
        <span className="block truncate text-[11px] font-semibold leading-tight text-ink lg:text-[12px]">
          {title}
        </span>
        <span className="mt-0.5 block text-[11px] font-bold text-ink lg:text-[12px]">
          {priceLabel(price, priceType)}
        </span>
      </span>
    </Link>
  );
}
