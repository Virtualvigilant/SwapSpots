import { AlertCircle, CheckCircle2 } from "lucide-react";
import type { ActionState } from "@/lib/validation/shared";

/** Renders whatever a Server Action came back with, success or failure. */
export function FormStatus({ state }: { state: ActionState | null }) {
  if (!state) return null;

  if (state.ok && state.message) {
    return (
      <p className="flex items-start gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-3.5 py-2.5 text-[12.5px] leading-relaxed text-emerald-700">
        <CheckCircle2 className="mt-px size-4 shrink-0" />
        {state.message}
      </p>
    );
  }

  if (state.error) {
    return (
      <p
        role="alert"
        className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-3.5 py-2.5 text-[12.5px] leading-relaxed text-red-600"
      >
        <AlertCircle className="mt-px size-4 shrink-0" />
        {state.error}
      </p>
    );
  }

  return null;
}

/** The first error for one field, or nothing. */
export function FieldError({
  state,
  name,
}: {
  state: ActionState | null;
  name: string;
}) {
  const message = state?.fieldErrors?.[name]?.[0];
  if (!message) return null;
  return (
    <span className="mt-1.5 block text-[11.5px] font-semibold text-red-600">
      {message}
    </span>
  );
}
