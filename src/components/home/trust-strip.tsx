import { Banknote, Flag, MapPin, ShieldCheck } from "lucide-react";

const items = [
  {
    Icon: ShieldCheck,
    title: "Student Verified",
    body: "Admission numbers checked by hand",
  },
  {
    Icon: Banknote,
    title: "No Fees Ever",
    body: "We never touch your money",
  },
  {
    Icon: Flag,
    title: "Report & Review",
    body: "Moderated within 24 hours",
  },
  {
    Icon: MapPin,
    title: "Meet On Campus",
    body: "Collect at a place you both know",
  },
];

export function TrustStrip() {
  return (
    <section className="bg-white pb-12 pt-2">
      <div className="container-page">
        <ul className="grid gap-y-6 rounded-2xl border border-line bg-surface px-6 py-7 sm:grid-cols-2 lg:grid-cols-4">
          {items.map(({ Icon, title, body }) => (
            <li key={title} className="flex items-center gap-3.5 lg:justify-center">
              <span className="grid size-9 shrink-0 place-items-center rounded-full border border-line bg-white text-ink">
                <Icon className="size-4" strokeWidth={1.8} />
              </span>
              <div>
                <p className="text-[13px] font-bold leading-tight text-ink">{title}</p>
                <p className="mt-0.5 text-[11.5px] leading-tight text-ink-500">{body}</p>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
