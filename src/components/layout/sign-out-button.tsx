"use client";

import { useTransition } from "react";
import { LogOut } from "lucide-react";
import { signOut } from "@/lib/actions/auth";
import { buttonClasses } from "@/components/ui/button";
import { cn } from "@/lib/cn";

export function SignOutButton({ className }: { className?: string }) {
  const [pending, startTransition] = useTransition();

  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => startTransition(() => signOut())}
      className={cn(buttonClasses("outline", "sm"), className)}
    >
      <LogOut className="size-3.5" />
      {pending ? "Signing out…" : "Sign out"}
    </button>
  );
}
