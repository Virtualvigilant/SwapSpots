"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getUser } from "@/lib/queries/session";
import { reviewSchema } from "@/lib/validation/moderation";
import { fieldErrors, type ActionState } from "@/lib/validation/shared";
import { toActionError } from "./errors";

/**
 * §5.4 — the trigger refuses a review with no contact event behind it. That is
 * the whole reason these ratings mean anything without payments to verify
 * against, so the failure is surfaced as-is rather than smoothed over.
 */
export async function createReview(
  _prev: ActionState | null,
  formData: FormData,
): Promise<ActionState> {
  const user = await getUser();
  if (!user) return { ok: false, error: "Sign in first." };

  const parsed = reviewSchema.safeParse({
    revieweeId: formData.get("revieweeId"),
    contextType: formData.get("contextType"),
    contextId: formData.get("contextId"),
    reviewedRole: formData.get("reviewedRole"),
    rating: formData.get("rating"),
    comment: formData.get("comment"),
  });
  if (!parsed.success) return fieldErrors(parsed.error);

  const supabase = await createClient();
  const { error } = await supabase.from("reviews").insert({
    reviewer_id: user.id,
    reviewee_id: parsed.data.revieweeId,
    context_type: parsed.data.contextType,
    context_id: parsed.data.contextId,
    reviewed_role: parsed.data.reviewedRole,
    rating: parsed.data.rating,
    comment: parsed.data.comment ?? null,
  });

  if (error) return toActionError(error);

  revalidatePath("/me/reviews");
  if (parsed.data.contextType === "listing") {
    revalidatePath(`/listings/${parsed.data.contextId}`);
  } else {
    revalidatePath(`/requests/${parsed.data.contextId}`);
  }
  return { ok: true, message: "Review posted." };
}
