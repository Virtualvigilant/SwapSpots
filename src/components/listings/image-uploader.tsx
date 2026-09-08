"use client";

import { useRef, useState, useTransition } from "react";
import Image from "next/image";
import { ImagePlus, Loader2, Trash2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { compressImage } from "@/lib/images.client";
import {
  listingImageUrl,
  objectPath,
  MAX_LISTING_IMAGES,
} from "@/lib/images";
import { LISTING_IMAGES_BUCKET } from "@/lib/constants";
import { cn } from "@/lib/cn";

/**
 * Uploads straight from the browser to Storage, compressing first (§5.1).
 *
 * The form only ever submits storage paths, so a Server Action never has to
 * carry a few megabytes of image through the request body. Paths are
 * `{user_id}/…`, which is what the bucket policy checks.
 */
export function ImageUploader({
  userId,
  initialPaths = [],
}: {
  userId: string;
  initialPaths?: string[];
}) {
  const [paths, setPaths] = useState<string[]>(initialPaths);
  const [error, setError] = useState<string | null>(null);
  const [uploading, startUpload] = useTransition();
  const inputRef = useRef<HTMLInputElement>(null);

  function onPick(files: FileList | null) {
    if (!files?.length) return;
    setError(null);

    const room = MAX_LISTING_IMAGES - paths.length;
    const chosen = Array.from(files).slice(0, room);
    if (chosen.length < files.length) {
      setError(`Six photos maximum — the extra ${files.length - chosen.length} were skipped.`);
    }

    startUpload(async () => {
      const supabase = createClient();
      const uploaded: string[] = [];

      for (const file of chosen) {
        try {
          const compressed = await compressImage(file);
          const path = objectPath(userId, compressed.name);
          const { error: uploadError } = await supabase.storage
            .from(LISTING_IMAGES_BUCKET)
            .upload(path, compressed, {
              contentType: compressed.type,
              upsert: false,
            });

          if (uploadError) {
            setError(uploadError.message);
            break;
          }
          uploaded.push(path);
        } catch (e) {
          setError(e instanceof Error ? e.message : "Could not process that image.");
          break;
        }
      }

      if (uploaded.length) setPaths((current) => [...current, ...uploaded]);
      if (inputRef.current) inputRef.current.value = "";
    });
  }

  function remove(path: string) {
    setPaths((current) => current.filter((p) => p !== path));
    // The object is left in the bucket deliberately: deleting it here would
    // break an edit that is later abandoned. Orphans age out with the account.
  }

  return (
    <div>
      {/* What the Server Action actually reads. */}
      {paths.map((p) => (
        <input key={p} type="hidden" name="images" value={p} />
      ))}

      <div className="flex flex-wrap gap-3">
        {paths.map((path, i) => (
          <div
            key={path}
            className="relative size-24 overflow-hidden rounded-xl border border-line bg-surface"
          >
            <Image
              src={listingImageUrl(path)!}
              alt=""
              fill
              sizes="96px"
              className="object-cover"
            />
            {i === 0 && (
              <span className="absolute left-1 top-1 rounded bg-ink px-1.5 py-0.5 text-[9px] font-bold text-white">
                Cover
              </span>
            )}
            <button
              type="button"
              onClick={() => remove(path)}
              aria-label="Remove image"
              className="absolute bottom-1 right-1 grid size-6 place-items-center rounded-md bg-white/90 text-ink-500 hover:text-red-600"
            >
              <Trash2 className="size-3" />
            </button>
          </div>
        ))}

        {paths.length < MAX_LISTING_IMAGES && (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={uploading}
            className={cn(
              "grid size-24 place-items-center rounded-xl border border-dashed border-line bg-surface/60 text-ink-400 transition-colors",
              uploading ? "opacity-60" : "hover:border-brand hover:text-brand",
            )}
          >
            <span className="flex flex-col items-center gap-1">
              {uploading ? (
                <Loader2 className="size-5 animate-spin" />
              ) : (
                <ImagePlus className="size-5" />
              )}
              <span className="text-[10.5px] font-semibold">
                {uploading ? "Uploading" : "Add"}
              </span>
            </span>
          </button>
        )}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        hidden
        onChange={(e) => onPick(e.target.files)}
      />

      {error && (
        <p role="alert" className="mt-3 text-[11.5px] font-semibold text-red-600">
          {error}
        </p>
      )}
    </div>
  );
}
