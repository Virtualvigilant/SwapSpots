import { ShieldCheck, Tag, Zap } from "lucide-react";

const items = [
  { Icon: ShieldCheck, text: "Every seller is a verified student" },
  { Icon: Tag, text: "Zero commission — you keep 100%" },
  { Icon: Zap, text: "Post a request, get bids in minutes" },
];

/**
 * Thin dark strip above the header. On mobile only the middle message shows;
 * the row is not important enough to earn a second line.
 */
export function AnnouncementBar() {
  return (
    <div className="bg-ink text-white">
      <div className="container-page flex h-11 items-center justify-center gap-8 text-[12px] sm:gap-12">
        {items.map(({ Icon, text }, i) => (
          <span
            key={text}
            className={`flex items-center gap-2 whitespace-nowrap ${
              i === 1 ? "" : "hidden md:flex"
            }`}
          >
            <Icon className="size-3.5 shrink-0 text-brand" strokeWidth={2} />
            <span className="text-white/85">{text}</span>
          </span>
        ))}
      </div>
    </div>
  );
}
