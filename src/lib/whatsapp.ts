/**
 * WhatsApp handoff (§5.3).
 *
 * The link itself is built by the `reveal_contact` RPC, server-side, from the
 * validated `phone_e164` column — never from user-supplied text. This module
 * only holds the shape of what comes back and a display formatter.
 */
export type ContactReveal = {
  phone: string;
  wa_link: string;
  recipient_id: string;
  recipient_name: string;
};

export function isContactReveal(value: unknown): value is ContactReveal {
  if (typeof value !== "object" || value === null) return false;
  const v = value as Record<string, unknown>;
  return typeof v.phone === "string" && typeof v.wa_link === "string";
}

/** +254712345678 -> +254 712 345 678 */
export function formatPhone(e164: string): string {
  const m = /^\+254(\d{3})(\d{3})(\d{3})$/.exec(e164);
  return m ? `+254 ${m[1]} ${m[2]} ${m[3]}` : e164;
}
