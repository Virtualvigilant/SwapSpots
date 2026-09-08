/** Heading + one line of context, used at the top of each `/me` panel. */
export function SectionLead({
  title,
  lead,
  action,
}: {
  title: string;
  lead: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h2 className="font-display text-[20px] font-extrabold tracking-[-0.03em] text-ink">
          {title}
        </h2>
        <p className="mt-1.5 max-w-[62ch] text-[13px] leading-relaxed text-ink-500">{lead}</p>
      </div>
      {action}
    </div>
  );
}
