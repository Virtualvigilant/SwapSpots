"use client";

import { useActionState, useRef, useState, useTransition } from "react";
import Link from "next/link";
import { ShieldCheck, Upload } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { compressImage } from "@/lib/images.client";
import { objectPath } from "@/lib/images";
import { VERIFICATION_BUCKET } from "@/lib/constants";
import { submitVerification } from "@/lib/actions/profile";
import { Field, Input } from "@/components/ui/field";
import { SubmitButton } from "@/components/ui/submit-button";
import { FormStatus, FieldError } from "@/components/ui/form-status";
import { buttonClasses } from "@/components/ui/button";
import type { Database } from "@/types/database";

type Status = Database["public"]["Enums"]["verification_status"];

/**
 * §4.1 — manual verification, deliberately. The ID photo goes to a private
 * bucket; only a SHA-256 of the admission number is ever stored, and the photo
 * is purged 30 days after the decision by a scheduled job.
 *
 * NOT CURRENTLY MOUNTED. Verification is off as a gate — anyone with an account
 * can list, request and bid on the same terms (migration 0009) — so there is no
 * reason to ask someone for their student ID yet. Everything behind this still
 * works: `submit_verification`, the admin queue at /admin/verifications, the
 * private bucket, and the badge. Re-enable by importing it back into
 * /me/settings.
 */
export function VerificationForm({
  userId,
  status,
  verifiedAt,
}: {
  userId: string;
  status: Status;
  verifiedAt: string | null;
}) {
  const [state, action] = useActionState(submitVerification, null);
  const [path, setPath] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploading, startUpload] = useTransition();
  const inputRef = useRef<HTMLInputElement>(null);

  if (status === "verified") {
    return (
      <section className="rounded-2xl border border-line bg-white p-5 sm:p-6">
        <h2 className="flex items-center gap-2 font-display text-[16px] font-bold text-ink">
          <ShieldCheck className="size-4 text-emerald-600" />
          Verified
        </h2>
        <p className="mt-2 text-[12.5px] leading-relaxed text-ink-500">
          Your admission number was verified
          {verifiedAt
            ? ` in ${new Date(verifiedAt).toLocaleDateString("en-KE", {
                month: "long",
                year: "numeric",
              })}`
            : ""}
          . Only a hash of it is stored — the ID photo you uploaded is deleted 30
          days after approval.
        </p>
        <Link
          href="/verification"
          className={buttonClasses("outline", "sm", "mt-4")}
        >
          How verification works
        </Link>
      </section>
    );
  }

  if (status === "pending") {
    return (
      <section className="rounded-2xl border border-line bg-white p-5 sm:p-6">
        <h2 className="font-display text-[16px] font-bold text-ink">
          Verification in review
        </h2>
        <p className="mt-2 text-[12.5px] leading-relaxed text-ink-500">
          A moderator checks these by hand, usually within a day. Your caps lift
          the moment it is approved.
        </p>
      </section>
    );
  }

  function upload(file: File | undefined) {
    if (!file) return;
    setUploadError(null);
    startUpload(async () => {
      try {
        const compressed = await compressImage(file);
        const target = objectPath(userId, compressed.name);
        const supabase = createClient();
        const { error } = await supabase.storage
          .from(VERIFICATION_BUCKET)
          .upload(target, compressed, { contentType: compressed.type });

        if (error) {
          setUploadError(error.message);
          return;
        }
        setPath(target);
        setFileName(file.name);
      } catch (e) {
        setUploadError(
          e instanceof Error ? e.message : "Could not process that image.",
        );
      }
    });
  }

  return (
    <form
      action={action}
      className="rounded-2xl border border-line bg-white p-5 sm:p-6"
    >
      <h2 className="flex items-center gap-2 font-display text-[16px] font-bold text-ink">
        <ShieldCheck className="size-4 text-brand" />
        Get verified
      </h2>
      <p className="mt-2 max-w-[62ch] text-[12.5px] leading-relaxed text-ink-500">
        {status === "rejected"
          ? "Your last submission was not approved. You can try again with a clearer photo."
          : "Verifying lifts your listing, request and bid caps and adds the badge. We store only a hash of your admission number, and the photo is deleted 30 days after the decision."}
      </p>

      <div className="mt-5 space-y-4">
        <FormStatus state={state} />

        <Field label="Admission number" required>
          <Input name="admissionNumber" required placeholder="BIT/1234/22" />
          <FieldError state={state} name="admissionNumber" />
        </Field>

        <div>
          <p className="text-[12.5px] font-bold text-ink">
            Student ID photo <span className="text-brand">*</span>
          </p>
          <input type="hidden" name="idImagePath" value={path ?? ""} />
          <button
            type="button"
            disabled={uploading}
            onClick={() => inputRef.current?.click()}
            className={buttonClasses("outline", "sm", "mt-2")}
          >
            <Upload className="size-3.5" />
            {uploading ? "Uploading…" : path ? "Replace photo" : "Upload photo"}
          </button>
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            hidden
            onChange={(e) => upload(e.target.files?.[0])}
          />
          {fileName && (
            <p className="mt-2 text-[11.5px] text-emerald-600">
              {fileName} uploaded to the private bucket.
            </p>
          )}
          {uploadError && (
            <p className="mt-2 text-[11.5px] font-semibold text-red-600">
              {uploadError}
            </p>
          )}
          <FieldError state={state} name="idImagePath" />
        </div>

        <SubmitButton size="md" pendingLabel="Submitting…">
          Submit for review
        </SubmitButton>
      </div>
    </form>
  );
}
