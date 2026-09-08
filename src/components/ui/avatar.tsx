import Image from "next/image";
import { BadgeCheck } from "lucide-react";
import { cn } from "@/lib/cn";

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return "?";
  return (parts[0][0] + (parts.at(-1)?.[0] ?? "")).toUpperCase();
}

/**
 * Most accounts have no photo, so the fallback is the common case rather than
 * an edge case — initials on the brand tint, never a broken image frame.
 */
export function Avatar({
  src,
  name,
  size = 40,
  verified,
  className,
}: {
  src?: string | null;
  name: string;
  size?: number;
  verified?: boolean;
  className?: string;
}) {
  return (
    <span
      className={cn("relative inline-block shrink-0", className)}
      style={{ width: size, height: size }}
    >
      {src ? (
        <Image
          src={src}
          alt={name}
          width={size}
          height={size}
          className="size-full rounded-full object-cover"
        />
      ) : (
        <span
          className="grid size-full place-items-center rounded-full bg-brand-50 font-bold text-brand-700"
          style={{ fontSize: Math.max(10, size * 0.38) }}
          aria-hidden
        >
          {initials(name)}
        </span>
      )}
      {verified && (
        <BadgeCheck
          className="absolute -bottom-0.5 -right-0.5 size-[45%] rounded-full bg-white text-brand"
          strokeWidth={2.2}
        />
      )}
    </span>
  );
}
