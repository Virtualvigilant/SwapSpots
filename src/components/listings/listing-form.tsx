"use client";

import Link from "next/link";
import { useActionState } from "react";
import { createListing, updateListing } from "@/lib/actions/listings";
import type { CategorySummary } from "@/lib/queries/categories";
import type { ListingDetail } from "@/lib/queries/listings";
import { conditionOptions, priceTypeOptions, pickupAreas } from "@/lib/constants";
import { conditionLabels, priceTypeLabels } from "@/lib/format";
import {
  Field,
  Input,
  Textarea,
  Select,
  FormSection,
} from "@/components/ui/field";
import { SubmitButton } from "@/components/ui/submit-button";
import { FormStatus, FieldError } from "@/components/ui/form-status";
import { buttonClasses } from "@/components/ui/button";
import { ImageUploader } from "./image-uploader";

/**
 * Shared by `/listings/new` and `/listings/[id]/edit`. Passing a listing
 * switches it into edit mode and pre-fills every control.
 */
export function ListingForm({
  userId,
  categories,
  listing,
  defaultPickup,
}: {
  userId: string;
  categories: CategorySummary[];
  listing?: ListingDetail;
  defaultPickup?: string | null;
}) {
  const editing = Boolean(listing);
  const [state, action] = useActionState(
    editing ? updateListing : createListing,
    null,
  );

  return (
    <form action={action} className="space-y-4">
      {editing && <input type="hidden" name="id" value={listing!.id} />}

      <FormStatus state={state} />

      <FormSection
        title="Photos"
        description="1–6 images. The first one is the cover. Photos are compressed on your phone before upload, so this works on slow data."
      >
        <ImageUploader
          userId={userId}
          initialPaths={listing?.listing_images.map((i) => i.storage_path) ?? []}
        />
      </FormSection>

      <FormSection title="The basics">
        <Field label="Title" required hint="3–80 characters">
          <Input
            name="title"
            maxLength={80}
            required
            defaultValue={listing?.title}
            placeholder="Nike Air Max 270, size 42"
          />
          <FieldError state={state} name="title" />
        </Field>

        <Field
          label="Description"
          required
          hint="Say what is wrong with it too — it saves you three WhatsApp messages later."
        >
          <Textarea
            name="description"
            rows={6}
            maxLength={2000}
            required
            defaultValue={listing?.description}
            placeholder="Size 42, authentic. Bought in January, box included…"
          />
          <FieldError state={state} name="description" />
        </Field>

        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Category" required>
            <Select
              name="categoryId"
              defaultValue={listing?.category_id}
              options={categories.map((c) => ({ value: c.id, label: c.name }))}
            />
            <FieldError state={state} name="categoryId" />
          </Field>
          <Field label="Condition" required>
            <Select
              name="condition"
              defaultValue={listing?.condition ?? "good"}
              options={conditionOptions.map((c) => ({
                value: c,
                label: conditionLabels[c],
              }))}
            />
          </Field>
        </div>
      </FormSection>

      <FormSection title="Price and pickup">
        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Price (KES)" required>
            <Input
              type="number"
              name="price"
              min={0}
              step={1}
              defaultValue={listing?.price}
              placeholder="6500"
            />
            <FieldError state={state} name="price" />
          </Field>
          <Field label="Price type" required>
            <Select
              name="priceType"
              defaultValue={listing?.price_type ?? "negotiable"}
              options={priceTypeOptions.map((p) => ({
                value: p,
                label: priceTypeLabels[p],
              }))}
            />
          </Field>
        </div>

        <Field
          label="Pickup area"
          required
          hint="Where you would normally hand it over."
        >
          <Select
            name="pickupArea"
            defaultValue={listing?.pickup_area ?? defaultPickup ?? pickupAreas[0]}
            options={pickupAreas.map((a) => ({ value: a, label: a }))}
          />
        </Field>
      </FormSection>

      <div className="flex flex-wrap gap-3">
        <SubmitButton size="lg" pendingLabel="Saving…">
          {editing ? "Save changes" : "Publish listing"}
        </SubmitButton>
        <Link
          href={editing ? `/listings/${listing!.id}` : "/browse"}
          className={buttonClasses("ghost", "lg")}
        >
          Cancel
        </Link>
      </div>
    </form>
  );
}
