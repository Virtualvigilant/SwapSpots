"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

/**
 * §9.4 — subscribe narrowly.
 *
 * Broad subscriptions are the main cause of Realtime cost and client jank, so
 * this takes an explicit table and filter and does exactly one thing on an
 * event: ask the server for a fresh render. No client-side cache to drift out
 * of sync with RLS, and no duplicated row-shaping logic.
 */
export function RealtimeRefresh({
  table,
  filter,
  event = "*",
}: {
  table: "notifications" | "bids";
  filter: string;
  event?: "INSERT" | "UPDATE" | "*";
}) {
  const router = useRouter();

  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel(`${table}:${filter}`)
      .on(
        "postgres_changes",
        { event, schema: "public", table, filter },
        () => router.refresh(),
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [table, filter, event, router]);

  return null;
}
