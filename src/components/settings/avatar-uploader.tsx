"use client";

import { useRef, useTransition, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { compressImage } from "@/lib/images.client";
import { objectPath } from "@/lib/images";
import { AVATARS_BUCKET } from "@/lib/constants";
import { updateAvatar } from "@/lib/actions/profile";
import { buttonClasses } from "@/components/ui/button";

export function AvatarUploader({ userId }: { userId: string }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function upload(file: File | undefined) {
    if (!file) return;
    setError(null);

    start(async () => {
      try {
        const compressed = await compressImage(file);
        const path = objectPath(userId, compressed.name);
        const supabase = createClient();
        const { error: uploadError } = await supabase.storage
          .from(AVATARS_BUCKET)
          .upload(path, compressed, { contentType: compressed.type });

        if (uploadError) {
          setError(uploadError.message);
          return;
        }
        const result = await updateAvatar(path);
        if (result && !result.ok) setError(result.error ?? "Could not save.");
      } catch (e) {
        setError(e instanceof Error ? e.message : "Could not process that image.");
      }
    });
  }

  return (
    <div>
      <button
        type="button"
        disabled={pending}
        onClick={() => inputRef.current?.click()}
        className={buttonClasses("outline", "sm")}
      >
        {pending ? "Uploading…" : "Change photo"}
      </button>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        hidden
        onChange={(e) => upload(e.target.files?.[0])}
      />
      {error && (
        <p className="mt-2 text-[11.5px] font-semibold text-red-600">{error}</p>
      )}
    </div>
  );
}
