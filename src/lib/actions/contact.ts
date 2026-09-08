"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { isContactReveal, type ContactReveal } from "@/lib/whatsapp";
import type { Database } from "@/types/database";
import { toActionError } from "./errors";

export type RevealState =
  | { ok: true; contact: ContactReveal }
  | { ok: false; error: string }
  | null;

/**
 * §5.3 — the only path to a phone number.
 *
 * The RPC does the work: rate limit, contact_event insert, wa.me link built
 * server-side from the validated E.164 column. Nothing here touches the number
 * except to hand it back to the caller who just earned it.
 */
export async function revealContact(
  targetType: Database["public"]["Enums"]["contact_target"],
  targetId: string,
): Promise<RevealState> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("reveal_contact", {
    p_target_type: targetType,
    p_target_id: targetId,
  });

  if (error) {
    const mapped = toActionError(error, "Could not open contact details.");
    return { ok: false, error: mapped.error ?? "Could not open contact details." };
  }

  if (!isContactReveal(data)) {
    return { ok: false, error: "Could not open contact details." };
  }

  // The contact_event bumps contact_count, which the listing page shows.
  if (targetType === "listing") revalidatePath(`/listings/${targetId}`);
  return { ok: true, contact: data };
}
