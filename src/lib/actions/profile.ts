"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getUser, getCurrentProfile } from "@/lib/queries/session";
import {
  onboardingSchema,
  profileUpdateSchema,
} from "@/lib/validation/profile";
import { verificationSchema } from "@/lib/validation/moderation";
import { fieldErrors, type ActionState } from "@/lib/validation/shared";
import { CAMPUS_SLUG } from "@/lib/constants";
import { toActionError } from "./errors";

/**
 * Creates the profile row for an auth user who arrived without signup metadata
 * — OAuth, or a magic link straight into an empty account.
 */
export async function completeOnboarding(
  _prev: ActionState | null,
  formData: FormData,
): Promise<ActionState> {
  const user = await getUser();
  if (!user) return { ok: false, error: "Sign in first." };

  const parsed = onboardingSchema.safeParse({
    username: formData.get("username"),
    fullName: formData.get("fullName"),
    phone: formData.get("phone"),
    pickupArea: formData.get("pickupArea"),
  });
  if (!parsed.success) return fieldErrors(parsed.error);

  const supabase = await createClient();
  const { error } = await supabase.rpc("complete_onboarding", {
    p_username: parsed.data.username,
    p_full_name: parsed.data.fullName,
    p_phone_e164: parsed.data.phone,
    p_campus_slug: CAMPUS_SLUG,
    p_pickup_area: parsed.data.pickupArea,
  });

  if (error) return toActionError(error);

  revalidatePath("/", "layout");
  return { ok: true, message: "Profile created." };
}

export async function updateProfile(
  _prev: ActionState | null,
  formData: FormData,
): Promise<ActionState> {
  const profile = await getCurrentProfile();
  if (!profile) return { ok: false, error: "Sign in first." };

  const parsed = profileUpdateSchema.safeParse({
    username: formData.get("username"),
    fullName: formData.get("fullName"),
    phone: formData.get("phone"),
    bio: formData.get("bio"),
    pickupArea: formData.get("pickupArea"),
  });
  if (!parsed.success) return fieldErrors(parsed.error);

  const supabase = await createClient();
  const { error } = await supabase
    .from("profiles")
    .update({
      username: parsed.data.username,
      full_name: parsed.data.fullName,
      phone_e164: parsed.data.phone,
      bio: parsed.data.bio ?? null,
      pickup_area: parsed.data.pickupArea ?? null,
    })
    .eq("id", profile.id);

  if (error) return toActionError(error);

  revalidatePath("/me/settings");
  revalidatePath("/", "layout");
  return { ok: true, message: "Saved." };
}

export async function updateAvatar(storagePath: string): Promise<ActionState> {
  const user = await getUser();
  if (!user) return { ok: false, error: "Sign in first." };

  const supabase = await createClient();
  const { error } = await supabase
    .from("profiles")
    .update({ avatar_url: storagePath })
    .eq("id", user.id);

  if (error) return toActionError(error);

  revalidatePath("/", "layout");
  return { ok: true, message: "Photo updated." };
}

/**
 * §4.1 — manual verification, deliberately. The raw admission number never
 * reaches a column: the RPC hashes it and stores only the digest.
 */
export async function submitVerification(
  _prev: ActionState | null,
  formData: FormData,
): Promise<ActionState> {
  const user = await getUser();
  if (!user) return { ok: false, error: "Sign in first." };

  const parsed = verificationSchema.safeParse({
    admissionNumber: formData.get("admissionNumber"),
    idImagePath: formData.get("idImagePath"),
  });
  if (!parsed.success) return fieldErrors(parsed.error);

  const supabase = await createClient();
  const { error } = await supabase.rpc("submit_verification", {
    p_admission_number: parsed.data.admissionNumber,
    p_id_image_path: parsed.data.idImagePath,
  });

  if (error) return toActionError(error);

  revalidatePath("/me/settings");
  revalidatePath("/admin/verifications");
  return {
    ok: true,
    message: "Submitted. A moderator reviews these by hand, usually within a day.",
  };
}

/** Category follows are the growth loop for the request board (§5.7). */
export async function toggleCategorySubscription(
  categoryId: string,
  subscribed: boolean,
): Promise<ActionState> {
  const user = await getUser();
  if (!user) return { ok: false, error: "Sign in first." };

  const supabase = await createClient();
  const { error } = subscribed
    ? await supabase
        .from("category_subscriptions")
        .delete()
        .eq("user_id", user.id)
        .eq("category_id", categoryId)
    : await supabase
        .from("category_subscriptions")
        .insert({ user_id: user.id, category_id: categoryId });

  if (error) return toActionError(error);

  revalidatePath("/me/settings");
  return { ok: true, message: subscribed ? "Unfollowed" : "Following" };
}
