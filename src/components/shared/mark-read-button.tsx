"use client";

import { useTransition } from "react";
import { markNotificationsRead } from "@/lib/actions/notifications";
import { buttonClasses } from "@/components/ui/button";

export function MarkAllReadButton({ disabled }: { disabled: boolean }) {
  const [pending, startTransition] = useTransition();

  return (
    <button
      type="button"
      disabled={disabled || pending}
      onClick={() => startTransition(() => markNotificationsRead().then(() => {}))}
      className={buttonClasses("outline", "sm")}
    >
      {pending ? "Marking…" : "Mark all read"}
    </button>
  );
}
