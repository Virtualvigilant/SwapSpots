"use server";

import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/types/database";

/** Fire-and-forget view counter. A failure here must never break a page. */
export async function bumpView(
  targetType: Database["public"]["Enums"]["contact_target"],
  targetId: string,
): Promise<void> {
  const supabase = await createClient();
  await supabase.rpc("bump_view_count", {
    p_target_type: targetType,
    p_target_id: targetId,
  });
}
