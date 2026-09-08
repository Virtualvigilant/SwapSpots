import { cn } from "@/lib/cn";

const CONTROL =
  "w-full rounded-xl border border-line bg-white px-3.5 py-2.5 text-[14px] text-ink placeholder:text-ink-400 outline-none transition-colors focus:border-brand focus:ring-2 focus:ring-brand/15";

export function Field({
  label,
  hint,
  required,
  children,
  className,
}: {
  label: string;
  hint?: string;
  required?: boolean;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <label className={cn("block", className)}>
      <span className="flex items-baseline gap-1.5 text-[12.5px] font-bold text-ink">
        {label}
        {required && <span className="text-brand">*</span>}
      </span>
      {hint && <span className="mt-1 block text-[11.5px] text-ink-400">{hint}</span>}
      <span className="mt-2 block">{children}</span>
    </label>
  );
}

export function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={cn(CONTROL, props.className)} />;
}

export function Textarea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea {...props} className={cn(CONTROL, "resize-y", props.className)} />;
}

export function Select({
  options,
  ...props
}: React.SelectHTMLAttributes<HTMLSelectElement> & {
  options: { value: string; label: string }[];
}) {
  return (
    <select {...props} className={cn(CONTROL, "appearance-none pr-9", props.className)}>
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  );
}

/** Groups a form into a titled card, matching the panels used across `/me`. */
export function FormSection({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-line bg-white p-5 sm:p-6">
      <h2 className="font-display text-[16px] font-bold text-ink">{title}</h2>
      {description && (
        <p className="mt-1 text-[12.5px] leading-relaxed text-ink-500">{description}</p>
      )}
      <div className="mt-5 space-y-5">{children}</div>
    </section>
  );
}
