import { BadgeCheck, Gavel, Star } from "lucide-react";
import { WhatsAppIcon } from "@/components/ui/brand-icons";

const features = [
  {
    Icon: BadgeCheck,
    title: "Student Verified",
    body: "Admission-number checked",
  },
  {
    Icon: Gavel,
    title: "Post a Request",
    body: "Sellers bid, you pick",
  },
  {
    Icon: Star,
    title: "Dual Reputation",
    body: "Buyer and seller scores",
  },
  {
    Icon: WhatsAppIcon,
    title: "WhatsApp Handoff",
    body: "Talk to sellers directly",
  },
];

export function FeatureStrip() {
  return (
    <section className="border-b border-line bg-white">
      <div className="container-page grid grid-cols-2 gap-y-7 py-8 lg:grid-cols-4 lg:divide-x lg:divide-line lg:py-7">
        {features.map(({ Icon, title, body }) => (
          <div
            key={title}
            className="flex items-center gap-3.5 px-0 lg:justify-center lg:px-6"
          >
            <Icon className="size-6 shrink-0 text-ink" strokeWidth={1.6} />
            <div>
              <p className="text-[13.5px] font-bold leading-tight text-ink">{title}</p>
              <p className="mt-0.5 text-[12px] leading-tight text-ink-500">{body}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
