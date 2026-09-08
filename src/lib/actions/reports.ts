"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getUser } from "@/lib/queries/session";
import { reportSchema } from "@/lib/validation/moderation";
import { fieldErrors, type ActionState } from "@/lib/validation/shared";
import { toActionError } from "./errors";

export async function createReport(
  _prev: ActionState | null,
  formData: FormData,
): Promise<ActionState> {
  const user = await getUser();
  if (!user) return { ok: false, error: "Sign in to report something." };

  const parsed = reportSchema.safeParse({
    targetType: formData.get("targetType"),
    targetId: formData.get("targetId"),
    reason: formData.get("reason"),
    details: formData.get("details"),
  });
  if (!parsed.success) return fieldErrors(parsed.error);

  const supabase = await createClient();
  const { error } = await supabase.from("reports").insert({
    reporter_id: user.id,
    target_type: parsed.data.targetType,
    target_id: parsed.data.targetId,
    reason: parsed.data.reason,
    details: parsed.data.details ?? null,
  });

  if (error) return toActionError(error);

  revalidatePath("/admin/reports");
  return {
    ok: true,
    message: "Reported. A moderator will look at this — thank you.",
  };
}

/**
 * The standalone /report page takes a pasted URL rather than an id, because the
 * person filing it got there from a link, not from the item. Parsing it here
 * keeps the report attached to a real row so the moderator queue can resolve
 * the owner and count strikes against them.
 */
export async function createReportFromUrl(
  _prev: ActionState | null,
  formData: FormData,
): Promise<ActionState> {
  const user = await getUser();
  if (!user) return { ok: false, error: "Sign in to report something." };

  const raw = String(formData.get("url") ?? "").trim();
  const parsed = parseTargetUrl(raw);
  if (!parsed) {
    return {
      ok: false,
      error:
        "Paste the full address of the listing, request or profile you are reporting.",
      fieldErrors: { url: ["That does not look like a SwapSpot link."] },
    };
  }

  const supabase = await createClient();
  let targetId = parsed.id;

  // /u/<username> is a username, not a uuid — resolve it.
  if (parsed.type === "profile") {
    const { data } = await supabase
      .from("profiles")
      .select("id")
      .eq("username", parsed.id.toLowerCase())
      .maybeSingle();
    if (!data) {
      return { ok: false, error: "No account with that username." };
    }
    targetId = data.id;
  }

  const next = new FormData();
  next.set("targetType", parsed.type);
  next.set("targetId", targetId);
  next.set("reason", String(formData.get("reason") ?? "Something else"));
  next.set("details", String(formData.get("detail") ?? ""));

  return createReport(null, next);
}

function parseTargetUrl(
  input: string,
): { type: "listing" | "request" | "profile"; id: string } | null {
  if (!input) return null;

  // Accept a full URL or a bare path — people paste both.
  let path = input;
  try {
    if (/^https?:\/\//i.test(input)) path = new URL(input).pathname;
  } catch {
    return null;
  }

  const segments = path.split("/").filter(Boolean);
  if (segments.length < 2) return null;

  const [head, value] = segments;
  if (head === "listings") return { type: "listing", id: value };
  if (head === "requests") return { type: "request", id: value };
  if (head === "u") return { type: "profile", id: value };
  return null;
}
