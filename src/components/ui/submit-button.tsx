"use client";

import { useFormStatus } from "react-dom";
import { Loader2 } from "lucide-react";
import { buttonClasses, type ButtonSize, type ButtonVariant } from "./button";
import { cn } from "@/lib/cn";

/**
 * A submit button that disables itself while the action is in flight. Double
 * submission on a slow connection is the most common way to end up with two of
 * something, and campus connections are slow.
 */
export function SubmitButton({
  children,
  variant = "primary",
  size = "md",
  className,
  pendingLabel,
}: {
  children: React.ReactNode;
  variant?: ButtonVariant;
  size?: ButtonSize;
  className?: string;
  pendingLabel?: string;
}) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className={cn(buttonClasses(variant, size, className), "disabled:opacity-60")}
    >
      {pending && <Loader2 className="size-3.5 animate-spin" />}
      {pending ? (pendingLabel ?? children) : children}
    </button>
  );
}
