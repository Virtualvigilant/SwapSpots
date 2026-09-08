import type { PostgrestError } from "@supabase/supabase-js";
import type { ActionState } from "@/lib/validation/shared";

/**
 * Turns a Postgres error into something a student should read.
 *
 * Most of these come from triggers we wrote (rate limits, self-bidding, the
 * review gate), and those already raise a sentence meant for a human — so they
 * are passed through. The rest are codes that would otherwise surface as
 * "duplicate key value violates unique constraint bids_request_id_bidder_id_key".
 */
export function toActionError(
  error: PostgrestError | { message: string; code?: string } | null,
  fallback = "Something went wrong. Try again.",
): ActionState {
  if (!error) return { ok: false, error: fallback };

  const code = "code" in error ? error.code : undefined;
  const message = error.message ?? "";

  switch (code) {
    case "23505":
      if (message.includes("bids_request_id_bidder_id")) {
        return {
          ok: false,
          error: "You already have a bid on this request — edit it instead.",
        };
      }
      if (message.includes("profiles_username")) {
        return { ok: false, error: "That username is taken." };
      }
      if (message.includes("reports_reporter")) {
        return { ok: false, error: "You have already reported this." };
      }
      if (message.includes("reviews_reviewer")) {
        return { ok: false, error: "You have already reviewed this." };
      }
      return { ok: false, error: "That already exists." };

    case "42501":
      return {
        ok: false,
        error: "You do not have permission to do that.",
      };

    case "23514":
    case "P0001":
      // A CHECK constraint or an explicit RAISE from one of our triggers.
      return { ok: false, error: cleanMessage(message) || fallback };

    default:
      return { ok: false, error: cleanMessage(message) || fallback };
  }
}

function cleanMessage(message: string): string {
  // Postgres prefixes some errors with the failing constraint; drop the noise.
  const trimmed = message.replace(/^ERROR:\s*/i, "").trim();
  if (!trimmed || trimmed.includes("violates") || trimmed.includes("relation ")) {
    return "";
  }
  return trimmed.charAt(0).toUpperCase() + trimmed.slice(1);
}
