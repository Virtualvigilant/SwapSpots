"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/queries/session";
import { listingSchema } from "@/lib/validation/listing";
import { fieldErrors, type ActionState } from "@/lib/validation/shared";
import { toActionError } from "./errors";

function readListingForm(formData: FormData) {
  return {
    title: formData.get("title"),
    description: formData.get("description"),
    categoryId: formData.get("categoryId"),
    price: formData.get("priceType") === "free" ? 0 : formData.get("price"),
    priceType: formData.get("priceType"),
    condition: formData.get("condition"),
    pickupArea: formData.get("pickupArea"),
    images: formData.getAll("images").filter((v): v is string => typeof v === "string" && v !== ""),
  };
}

export async function createListing(
  _prev: ActionState | null,
  formData: FormData,
): Promise<ActionState> {
  const profile = await getCurrentProfile();
  if (!profile) return { ok: false, error: "Sign in to post a listing." };

  const parsed = listingSchema.safeParse(readListingForm(formData));
  if (!parsed.success) return fieldErrors(parsed.error);

  if (parsed.data.images.length === 0) {
    return { ok: false, error: "Add at least one photo — listings without one barely get contacted." };
  }

  const supabase = await createClient();
  const { data: listing, error } = await supabase
    .from("listings")
    .insert({
      seller_id: profile.id,
      campus_id: profile.campus_id,
      category_id: parsed.data.categoryId,
      title: parsed.data.title,
      description: parsed.data.description,
      price: parsed.data.price,
      price_type: parsed.data.priceType,
      condition: parsed.data.condition,
      pickup_area: parsed.data.pickupArea ?? profile.pickup_area,
      status: "active",
    })
    .select("id")
    .single();

  if (error) return toActionError(error);

  const { error: imageError } = await supabase.from("listing_images").insert(
    parsed.data.images.map((storage_path, position) => ({
      listing_id: listing.id,
      storage_path,
      position,
    })),
  );

  // The listing exists but has no photo, which is worse than not existing.
  if (imageError) {
    await supabase.from("listings").delete().eq("id", listing.id);
    return toActionError(imageError, "Could not attach the photos. Try again.");
  }

  revalidatePath("/browse");
  revalidatePath("/me/listings");
  redirect(`/listings/${listing.id}`);
}

export async function updateListing(
  _prev: ActionState | null,
  formData: FormData,
): Promise<ActionState> {
  const profile = await getCurrentProfile();
  if (!profile) return { ok: false, error: "Sign in first." };

  const id = String(formData.get("id") ?? "");
  const parsed = listingSchema.safeParse(readListingForm(formData));
  if (!parsed.success) return fieldErrors(parsed.error);

  const supabase = await createClient();
  const { error } = await supabase
    .from("listings")
    .update({
      category_id: parsed.data.categoryId,
      title: parsed.data.title,
      description: parsed.data.description,
      price: parsed.data.price,
      price_type: parsed.data.priceType,
      condition: parsed.data.condition,
      pickup_area: parsed.data.pickupArea,
    })
    .eq("id", id);

  if (error) return toActionError(error);

  // Replace the image set only when the form actually sent one.
  if (parsed.data.images.length) {
    await supabase.from("listing_images").delete().eq("listing_id", id);
    await supabase.from("listing_images").insert(
      parsed.data.images.map((storage_path, position) => ({
        listing_id: id,
        storage_path,
        position,
      })),
    );
  }

  revalidatePath(`/listings/${id}`);
  revalidatePath("/me/listings");
  return { ok: true, message: "Listing updated." };
}

/**
 * Status changes the seller controls: reserved, sold, hidden, and re-listing.
 * `removed` is deliberately absent — that is a moderator action (§5.1).
 */
export async function setListingStatus(
  id: string,
  status: "active" | "reserved" | "sold" | "hidden",
): Promise<ActionState> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("listings")
    .update({ status })
    .eq("id", id);

  if (error) return toActionError(error);

  revalidatePath("/me/listings");
  revalidatePath(`/listings/${id}`);
  revalidatePath("/browse");
  return { ok: true, message: "Listing updated." };
}

/** §5.1: the day-27 nudge is only useful if renewing is one action. */
export async function renewListing(id: string): Promise<ActionState> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("listings")
    .update({
      status: "active",
      expires_at: new Date(Date.now() + 30 * 86_400_000).toISOString(),
    })
    .eq("id", id);

  if (error) return toActionError(error);

  revalidatePath("/me/listings");
  revalidatePath(`/listings/${id}`);
  return { ok: true, message: "Renewed for another 30 days." };
}

export async function deleteListing(id: string): Promise<ActionState> {
  const supabase = await createClient();
  const { error } = await supabase.from("listings").delete().eq("id", id);
  if (error) return toActionError(error);

  revalidatePath("/me/listings");
  revalidatePath("/browse");
  redirect("/me/listings");
}
