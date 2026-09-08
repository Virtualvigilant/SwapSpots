"use client";

import { useState, useTransition } from "react";
import { FileImage } from "lucide-react";
import { reviewVerification, signVerificationDoc } from "@/lib/actions/admin";
import { buttonClasses } from "@/components/ui/button";
import { FormStatus } from "@/components/ui/form-status";
import type { ActionState } from "@/lib/validation/shared";

export function VerificationActions({
  requestId,
  imagePath,
  pending: isPending,
}: {
  requestId: string;
  imagePath: string;
  pending: boolean;
}) {
  const [busy, startTransition] = useTransition();
  const [state, setState] = useState<ActionState | null>(null);

  /** §10: signed URL, 60s TTL, staff only. Never a public link. */
  function openDoc() {
    startTransition(async () => {
      const result = await signVerificationDoc(imagePath);
      if ("error" in result) {
        setState({ ok: false, error: result.error });
        return;
      }
      window.open(result.url, "_blank", "noopener,noreferrer");
    });
  }

  return (
    <div className="flex shrink-0 flex-wrap items-center gap-2">
      {state && (
        <div className="w-full">
          <FormStatus state={state} />
        </div>
      )}

      {imagePath ? (
        <button
          type="button"
          disabled={busy}
          onClick={openDoc}
          className={buttonClasses("outline", "sm")}
        >
          <FileImage className="size-3.5" />
          View ID
        </button>
      ) : (
        <span className="text-[11.5px] text-ink-400">Photo purged</span>
      )}

      {isPending && (
        <>
          <button
            type="button"
            disabled={busy}
            onClick={() =>
              startTransition(async () =>
                setState(
                  await reviewVerification(
                    requestId,
                    false,
                    "The ID photo did not match the admission number.",
                  ),
                ),
              )
            }
            className={buttonClasses("danger", "sm")}
          >
            Reject
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={() =>
              startTransition(async () =>
                setState(await reviewVerification(requestId, true)),
              )
            }
            className={buttonClasses("dark", "sm")}
          >
            Approve
          </button>
        </>
      )}
    </div>
  );
}
