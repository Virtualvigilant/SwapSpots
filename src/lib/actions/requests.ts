"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/queries/session";
import { requestSchema } from "@/lib/validation/request";
import { fieldErrors, type ActionState } from "@/lib/validation/shared";
import { toActionError } from "./errors";

export async function createRequest(
  _prev: ActionState | null,
  formData: FormData,
): Promise<ActionState> {
  const profile = await getCurrentProfile();
  if (!profile) return { ok: false, error: "Sign in to post a request." };

  const parsed = requestSchema.safeParse({
    title: formData.get("title"),
    description: formData.get("description"),
    categoryId: formData.get("categoryId"),
    budgetMin: formData.get("budgetMin") || undefined,
    budgetMax: formData.get("budgetMax") || undefined,
    neededBy: formData.get("neededBy"),
    durationHours: formData.get("durationHours") || 48,
  });
  if (!parsed.success) return fieldErrors(parsed.error);

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("requests")
    .insert({
      requester_id: profile.id,
      campus_id: profile.campus_id,
      category_id: parsed.data.categoryId,
      title: parsed.data.title,
      description: parsed.data.description,
      budget_min: parsed.data.budgetMin ?? null,
      budget_max: parsed.data.budgetMax ?? null,
      needed_by: parsed.data.neededBy ?? null,
      expires_at: new Date(
        Date.now() + parsed.data.durationHours * 3_600_000,
      ).toISOString(),
    })
    .select("id")
    .single();

  if (error) return toActionError(error);

  revalidatePath("/requests");
  revalidatePath("/me/requests");
  redirect(`/requests/${data.id}`);
}

/**
 * §5.2 award. One RPC, one transaction — close the request, accept the winner,
 * reject everyone else, notify all of them, open the contact channel. Done as
 * separate calls from here, a dropped connection leaves a half-awarded request.
 */
export async function awardBid(
  requestId: string,
  bidId: string,
): Promise<ActionState> {
  const supabase = await createClient();
  const { error } = await supabase.rpc("award_bid", {
    p_request_id: requestId,
    p_bid_id: bidId,
  });

  if (error) return toActionError(error);

  revalidatePath(`/requests/${requestId}`);
  revalidatePath("/me/requests");
  return { ok: true, message: "Bid awarded. Contact details are now open." };
}

export async function markRequestFulfilled(
  requestId: string,
): Promise<ActionState> {
  const supabase = await createClient();
  const { error } = await supabase.rpc("mark_request_fulfilled", {
    p_request_id: requestId,
  });

  if (error) return toActionError(error);

  revalidatePath(`/requests/${requestId}`);
  revalidatePath("/me/requests");
  return { ok: true, message: "Marked fulfilled. You can both leave reviews now." };
}

export async function cancelRequest(
  requestId: string,
  reason?: string,
): Promise<ActionState> {
  const supabase = await createClient();
  const { error } = await supabase.rpc("cancel_request", {
    p_request_id: requestId,
    p_reason: reason,
  });

  if (error) return toActionError(error);

  revalidatePath(`/requests/${requestId}`);
  revalidatePath("/me/requests");
  return { ok: true, message: "Request cancelled." };
}
