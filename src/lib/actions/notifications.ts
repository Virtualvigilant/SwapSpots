"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { ActionState } from "@/lib/validation/shared";
import { toActionError } from "./errors";

export async function markNotificationsRead(
  ids?: string[],
): Promise<ActionState> {
  const supabase = await createClient();
  const { error } = await supabase.rpc("mark_notifications_read", {
    p_ids: ids && ids.length ? ids : undefined,
  });

  if (error) return toActionError(error);

  revalidatePath("/me/notifications");
  revalidatePath("/", "layout");
  return { ok: true };
}
