"use client";

import { useEffect, useRef } from "react";
import { bumpView } from "@/lib/actions/views";
import type { Database } from "@/types/database";

/**
 * Fires the view counter once per mount, from the client.
 *
 * Doing it in the Server Component would count prefetches and bot hits, and
 * would make an otherwise cacheable render write to the database.
 */
export function ViewCounter({
  targetType,
  targetId,
}: {
  targetType: Database["public"]["Enums"]["contact_target"];
  targetId: string;
}) {
  const counted = useRef(false);

  useEffect(() => {
    if (counted.current) return;
    counted.current = true;
    void bumpView(targetType, targetId);
  }, [targetType, targetId]);

  return null;
}
