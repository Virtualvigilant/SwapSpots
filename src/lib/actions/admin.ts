"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { ActionState } from "@/lib/validation/shared";
import type { Database } from "@/types/database";
import { toActionError } from "./errors";

type Enums = Database["public"]["Enums"];

/**
 * §5.8 — resolving a report is one RPC because an upheld report also writes a
 * strike, notifies the owner, and may suspend the account. Staff-only is
 * enforced inside the function, not here.
 */
export async function resolveReport(
  reportId: string,
  status: Enums["report_status"],
  notes?: string,
): Promise<ActionState> {
  const supabase = await createClient();
  const { error } = await supabase.rpc("resolve_report", {
    p_report_id: reportId,
    p_status: status,
    p_notes: notes,
  });

  if (error) return toActionError(error);

  revalidatePath("/admin/reports");
  return { ok: true, message: `Report marked ${status}.` };
}

/** Hides reported content without deleting it, so the audit trail survives. */
export async function moderateContent(
  target: "listing" | "request",
  id: string,
): Promise<ActionState> {
  const supabase = await createClient();
  const { error } =
    target === "listing"
      ? await supabase.from("listings").update({ status: "removed" }).eq("id", id)
      : await supabase
          .from("requests")
          .update({ status: "cancelled" })
          .eq("id", id);

  if (error) return toActionError(error);

  revalidatePath("/admin/reports");
  return { ok: true, message: "Content removed." };
}

export async function reviewVerification(
  requestId: string,
  approve: boolean,
  reason?: string,
): Promise<ActionState> {
  const supabase = await createClient();
  const { error } = await supabase.rpc("review_verification", {
    p_request_id: requestId,
    p_approve: approve,
    p_reason: reason,
  });

  if (error) return toActionError(error);

  revalidatePath("/admin/verifications");
  return { ok: true, message: approve ? "Verified." : "Rejected." };
}

/** Signed URL for a private verification photo. 60s TTL, staff-only (§10). */
export async function signVerificationDoc(
  path: string,
): Promise<{ url: string } | { error: string }> {
  const supabase = await createClient();
  const { data, error } = await supabase.storage
    .from("verification-docs")
    .createSignedUrl(path, 60);

  if (error || !data) return { error: "Could not open that document." };
  return { url: data.signedUrl };
}

export async function setCategoryActive(
  id: string,
  isActive: boolean,
): Promise<ActionState> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("categories")
    .update({ is_active: isActive })
    .eq("id", id);

  if (error) return toActionError(error);

  revalidatePath("/admin/categories");
  revalidatePath("/categories");
  return { ok: true, message: isActive ? "Category shown." : "Category hidden." };
}

export async function createCategory(
  _prev: ActionState | null,
  formData: FormData,
): Promise<ActionState> {
  const name = String(formData.get("name") ?? "").trim();
  const blurb = String(formData.get("blurb") ?? "").trim();

  if (name.length < 2) return { ok: false, error: "Give the category a name." };

  const slug = name
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  const supabase = await createClient();
  const { error } = await supabase.from("categories").insert({
    name,
    slug,
    blurb: blurb || null,
    sort_order: 80,
  });

  if (error) return toActionError(error);

  revalidatePath("/admin/categories");
  revalidatePath("/categories");
  return { ok: true, message: `${name} created.` };
}

export async function resolveModerationFlag(id: string): Promise<ActionState> {
  const supabase = await createClient();
  const { data: user } = await supabase.auth.getUser();
  const { error } = await supabase
    .from("moderation_flags")
    .update({
      resolved_at: new Date().toISOString(),
      resolved_by: user.user?.id ?? null,
    })
    .eq("id", id);

  if (error) return toActionError(error);

  revalidatePath("/admin/reports");
  return { ok: true, message: "Flag cleared." };
}
