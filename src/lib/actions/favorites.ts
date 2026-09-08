"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getUser } from "@/lib/queries/session";
import type { ActionState } from "@/lib/validation/shared";
import { toActionError } from "./errors";

export async function toggleFavorite(
  listingId: string,
  saved: boolean,
): Promise<ActionState> {
  const user = await getUser();
  if (!user) return { ok: false, error: "Sign in to save listings." };

  const supabase = await createClient();
  const { error } = saved
    ? await supabase
        .from("favorites")
        .delete()
        .eq("user_id", user.id)
        .eq("listing_id", listingId)
    : await supabase
        .from("favorites")
        .insert({ user_id: user.id, listing_id: listingId });

  if (error) return toActionError(error);

  revalidatePath("/me/favorites");
  revalidatePath(`/listings/${listingId}`);
  return { ok: true, message: saved ? "Removed" : "Saved" };
}
