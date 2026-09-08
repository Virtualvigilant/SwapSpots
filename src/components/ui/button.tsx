import { cn } from "@/lib/cn";

export type ButtonVariant = "primary" | "outline" | "dark" | "ghost" | "danger";
export type ButtonSize = "sm" | "md" | "lg";

const VARIANTS: Record<ButtonVariant, string> = {
  primary: "bg-brand text-white hover:bg-brand-600 shadow-[0_10px_24px_-12px_var(--color-brand-600)]",
  outline: "border border-line bg-white text-ink hover:border-ink-400",
  dark: "bg-ink text-white hover:bg-brand",
  ghost: "text-ink-700 hover:bg-surface hover:text-ink",
  danger: "border border-red-200 bg-white text-red-600 hover:bg-red-50",
};

const SIZES: Record<ButtonSize, string> = {
  sm: "h-9 px-4 text-[12.5px] rounded-lg gap-1.5",
  md: "h-11 px-6 text-[14px] rounded-xl gap-2",
  lg: "h-[50px] px-8 text-[15px] rounded-xl gap-2",
};

/**
 * Returns the class string for a button. Exported as a function rather than a
 * component because most "buttons" here are `next/link`s, and wrapping every
 * one of those in a polymorphic component costs more than it saves.
 */
export function buttonClasses(
  variant: ButtonVariant = "primary",
  size: ButtonSize = "md",
  extra?: string,
): string {
  return cn(
    "inline-flex items-center justify-center font-semibold transition-colors disabled:pointer-events-none disabled:opacity-50",
    VARIANTS[variant],
    SIZES[size],
    extra,
  );
}
