"use client";

import { useState, useTransition } from "react";
import { resolveReport, moderateContent } from "@/lib/actions/admin";
import { buttonClasses } from "@/components/ui/button";
import { FormStatus } from "@/components/ui/form-status";
import type { ActionState } from "@/lib/validation/shared";
import type { Database } from "@/types/database";

type Target = Database["public"]["Enums"]["report_target"];

/**
 * §5.8 — enforce consistently. Upholding a report writes a strike, notifies the
 * owner, and suspends at three in ninety days, all inside `resolve_report`.
 */
export function ReportActions({
  reportId,
  targetType,
  targetId,
}: {
  reportId: string;
  targetType: Target;
  targetId: string;
}) {
  const [pending, startTransition] = useTransition();
  const [state, setState] = useState<ActionState | null>(null);

  const run = (fn: () => Promise<ActionState>) =>
    startTransition(async () => setState(await fn()));

  const removable = targetType === "listing" || targetType === "request";

  return (
    <div className="flex flex-wrap items-center gap-2">
      {state && (
        <div className="w-full">
          <FormStatus state={state} />
        </div>
      )}

      <button
        type="button"
        disabled={pending}
        onClick={() => run(() => resolveReport(reportId, "dismissed"))}
        className={buttonClasses("outline", "sm")}
      >
        Dismiss
      </button>

      {removable && (
        <button
          type="button"
          disabled={pending}
          onClick={() =>
            run(async () => {
              const removed = await moderateContent(
                targetType as "listing" | "request",
                targetId,
              );
              if (!removed.ok) return removed;
              return resolveReport(reportId, "actioned", "Content removed");
            })
          }
          className={buttonClasses("dark", "sm")}
        >
          Remove content
        </button>
      )}

      <button
        type="button"
        disabled={pending}
        onClick={() => run(() => resolveReport(reportId, "actioned"))}
        className={buttonClasses("danger", "sm")}
      >
        Uphold — add strike
      </button>
    </div>
  );
}
