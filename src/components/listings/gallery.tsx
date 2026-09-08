"use client";

import Image from "next/image";
import { useState } from "react";
import { ImageOff } from "lucide-react";
import { listingImageUrl } from "@/lib/images";
import { cn } from "@/lib/cn";

export function Gallery({
  paths,
  title,
}: {
  paths: string[];
  title: string;
}) {
  const [active, setActive] = useState(0);
  const urls = paths.map((p) => listingImageUrl(p)).filter((u): u is string => Boolean(u));

  if (urls.length === 0) {
    return (
      <div className="grid aspect-square max-w-[620px] place-items-center rounded-2xl border border-line bg-surface text-ink-400">
        <ImageOff className="size-8" strokeWidth={1.5} />
      </div>
    );
  }

  return (
    <div className="max-w-[620px]">
      <div className="relative aspect-square overflow-hidden rounded-2xl border border-line bg-surface">
        <Image
          src={urls[Math.min(active, urls.length - 1)]}
          alt={title}
          fill
          priority
          sizes="(max-width: 1024px) 100vw, 620px"
          className="object-cover"
        />
      </div>

      {urls.length > 1 && (
        <ul className="mt-3 flex gap-3">
          {urls.map((src, i) => (
            <li key={src}>
              <button
                type="button"
                onClick={() => setActive(i)}
                aria-label={`View image ${i + 1} of ${urls.length}`}
                aria-current={i === active}
                className={cn(
                  "relative size-16 overflow-hidden rounded-xl border-2 bg-surface transition-colors",
                  i === active ? "border-brand" : "border-line hover:border-ink-400",
                )}
              >
                <Image src={src} alt="" fill sizes="64px" className="object-cover" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
