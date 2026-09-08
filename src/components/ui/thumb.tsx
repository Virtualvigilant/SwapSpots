import Image from "next/image";
import { ImageOff } from "lucide-react";
import { listingImageUrl } from "@/lib/images";
import { cn } from "@/lib/cn";

/**
 * A listing photo, or a neutral placeholder when there is none.
 *
 * Listings require a photo at creation, but moderation and migrations can both
 * leave one without — a grid that renders a broken frame in that case looks
 * like the site is down.
 */
export function Thumb({
  path,
  alt,
  sizes,
  className,
  priority,
}: {
  path: string | null | undefined;
  alt: string;
  sizes?: string;
  className?: string;
  priority?: boolean;
}) {
  const url = listingImageUrl(path);

  if (!url) {
    return (
      <span
        className={cn(
          "grid size-full place-items-center bg-surface text-ink-400",
          className,
        )}
      >
        <ImageOff className="size-5" strokeWidth={1.6} />
      </span>
    );
  }

  return (
    <Image
      src={url}
      alt={alt}
      fill
      sizes={sizes}
      priority={priority}
      className={cn("object-cover", className)}
    />
  );
}
