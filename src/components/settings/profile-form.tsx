"use client";

import { useActionState } from "react";
import { updateProfile } from "@/lib/actions/profile";
import type { CurrentProfile } from "@/lib/queries/session";
import { pickupAreas } from "@/lib/constants";
import { avatarUrl } from "@/lib/images";
import {
  Field,
  Input,
  Textarea,
  Select,
  FormSection,
} from "@/components/ui/field";
import { Avatar } from "@/components/ui/avatar";
import { SubmitButton } from "@/components/ui/submit-button";
import { FormStatus, FieldError } from "@/components/ui/form-status";
import { AvatarUploader } from "./avatar-uploader";

export function ProfileForm({
  profile,
  email,
}: {
  profile: CurrentProfile;
  email: string;
}) {
  const [state, action] = useActionState(updateProfile, null);

  return (
    <form action={action} className="space-y-4">
      <FormStatus state={state} />

      <FormSection title="Profile" description="This is what other students see.">
        <div className="flex items-center gap-4">
          <Avatar
            src={avatarUrl(profile.avatar_url)}
            name={profile.full_name}
            size={64}
            verified={profile.verification_status === "verified"}
          />
          <AvatarUploader userId={profile.id} />
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Full name" required>
            <Input name="fullName" required defaultValue={profile.full_name} />
            <FieldError state={state} name="fullName" />
          </Field>
          <Field label="Username" required hint="Lowercase, 3–20 characters">
            <Input name="username" required defaultValue={profile.username} />
            <FieldError state={state} name="username" />
          </Field>
        </div>

        <Field label="Bio" hint="Up to 300 characters">
          <Textarea
            name="bio"
            rows={3}
            maxLength={300}
            defaultValue={profile.bio ?? ""}
          />
          <FieldError state={state} name="bio" />
        </Field>

        <Field
          label="Usual pickup area"
          hint="Shown on your listings as a default."
        >
          <Select
            name="pickupArea"
            defaultValue={profile.pickup_area ?? pickupAreas[0]}
            options={pickupAreas.map((a) => ({ value: a, label: a }))}
          />
        </Field>
      </FormSection>

      <FormSection
        title="Contact"
        description="Your number is never rendered on a page. It is only returned when a signed-in buyer taps Reveal contact, and that reveal is logged."
      >
        <Field
          label="WhatsApp number"
          required
          hint="Kenyan mobile. Stored in E.164 — 0712… and +254 712… both work. Re-enter it to change it."
        >
          <Input
            type="tel"
            name="phone"
            required
            placeholder="0712 345 678"
            autoComplete="tel"
          />
          <FieldError state={state} name="phone" />
        </Field>
        <Field label="Email" hint="Change this from your auth provider.">
          <Input type="email" value={email} readOnly disabled />
        </Field>
      </FormSection>

      <div className="flex flex-wrap gap-3">
        <SubmitButton size="lg" pendingLabel="Saving…">
          Save changes
        </SubmitButton>
      </div>
    </form>
  );
}
