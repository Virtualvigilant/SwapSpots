/**
 * Long-form policy copy. Typographic rules live here rather than being
 * repeated across every legal page.
 */
export function Prose({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="
        max-w-[70ch] text-[14px] leading-[1.75] text-ink-700
        [&_a]:font-semibold [&_a]:text-brand hover:[&_a]:underline
        [&_h2]:mt-10 [&_h2]:font-display [&_h2]:text-[19px] [&_h2]:font-extrabold [&_h2]:tracking-[-0.03em] [&_h2]:text-ink
        [&_h3]:mt-7 [&_h3]:font-display [&_h3]:text-[15px] [&_h3]:font-bold [&_h3]:text-ink
        [&_li]:mt-1.5
        [&_ol]:mt-3 [&_ol]:list-decimal [&_ol]:pl-5
        [&_p]:mt-3
        [&_strong]:font-bold [&_strong]:text-ink
        [&_ul]:mt-3 [&_ul]:list-disc [&_ul]:pl-5
      "
    >
      {children}
    </div>
  );
}
