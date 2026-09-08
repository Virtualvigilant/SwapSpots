"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/queries/session";
import { bidSchema } from "@/lib/validation/request";
import { fieldErrors, type ActionState } from "@/lib/validation/shared";
import { toActionError } from "./errors";

export async function placeBid(
  _prev: ActionState | null,
  formData: FormData,
): Promise<ActionState> {
  const profile = await getCurrentProfile();
  if (!profile) return { ok: false, error: "Sign in to bid." };

  const parsed = bidSchema.safeParse({
    requestId: formData.get("requestId"),
    amount: formData.get("amount"),
    message: formData.get("message"),
    availability: formData.get("availability"),
    listingId: formData.get("listingId"),
  });
  if (!parsed.success) return fieldErrors(parsed.error);

  const supabase = await createClient();
  const { error } = await supabase.from("bids").insert({
    request_id: parsed.data.requestId,
    bidder_id: profile.id,
    amount: parsed.data.amount,
    message: parsed.data.message ?? null,
    availability: parsed.data.availability ?? null,
    listing_id: parsed.data.listingId ?? null,
  });

  if (error) return toActionError(error);

  revalidatePath(`/requests/${parsed.data.requestId}`);
  revalidatePath("/me/bids");
  return { ok: true, message: "Bid placed." };
}

/** §5.2: editable until awarded, so sellers can refine after seeing the board. */
export async function updateBid(
  _prev: ActionState | null,
  formData: FormData,
): Promise<ActionState> {
  const profile = await getCurrentProfile();
  if (!profile) return { ok: false, error: "Sign in first." };

  const bidId = String(formData.get("bidId") ?? "");
  const parsed = bidSchema.safeParse({
    requestId: formData.get("requestId"),
    amount: formData.get("amount"),
    message: formData.get("message"),
    availability: formData.get("availability"),
    listingId: formData.get("listingId"),
  });
  if (!parsed.success) return fieldErrors(parsed.error);

  const supabase = await createClient();
  const { error } = await supabase
    .from("bids")
    .update({
      amount: parsed.data.amount,
      message: parsed.data.message ?? null,
      availability: parsed.data.availability ?? null,
    })
    .eq("id", bidId);

  if (error) return toActionError(error);

  revalidatePath(`/requests/${parsed.data.requestId}`);
  revalidatePath("/me/bids");
  return { ok: true, message: "Bid updated." };
}

export async function withdrawBid(
  bidId: string,
  requestId: string,
): Promise<ActionState> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("bids")
    .update({ status: "withdrawn" })
    .eq("id", bidId);

  if (error) return toActionError(error);

  revalidatePath(`/requests/${requestId}`);
  revalidatePath("/me/bids");
  return { ok: true, message: "Bid withdrawn." };
}
