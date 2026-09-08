import { z } from "zod";

/**
 * Zod schemas mirror the CHECK constraints in §6 exactly. They exist to give a
 * usable error message, not to provide safety — the database rejects bad rows
 * on its own, which is what actually matters when someone posts straight to
 * PostgREST with the anon key.
 */

/**
 * Kenyan mobile numbers arrive as `0712…`, `254712…`, `+254 712 345 678`.
 * The column only accepts E.164, so normalise before validating rather than
 * bouncing someone for typing their number the way they always write it.
 */
export function normalizePhone(input: string): string {
  const digits = input.replace(/[^\d+]/g, "");
  if (/^\+254[17]\d{8}$/.test(digits)) return digits;
  if (/^254[17]\d{8}$/.test(digits)) return `+${digits}`;
  if (/^0[17]\d{8}$/.test(digits)) return `+254${digits.slice(1)}`;
  if (/^[17]\d{8}$/.test(digits)) return `+254${digits}`;
  return digits;
}

export const phoneSchema = z
  .string()
  .trim()
  .transform(normalizePhone)
  .refine((v) => /^\+254[17]\d{8}$/.test(v), {
    message: "Enter a Kenyan mobile number, e.g. 0712 345 678.",
  });

export const usernameSchema = z
  .string()
  .trim()
  .toLowerCase()
  .regex(
    /^[a-z0-9_]{3,20}$/,
    "3–20 characters, lowercase letters, numbers and underscores only.",
  );

export const uuidSchema = z.string().uuid("That item no longer exists.");

/** Empty form fields arrive as "" — treat them as absent, not as a value. */
export const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max, `Keep this under ${max} characters.`)
    .optional()
    .transform((v) => (v ? v : undefined));

export const priceSchema = z.coerce
  .number({ message: "Enter a price." })
  .min(0, "Price cannot be negative.")
  .max(9_999_999, "That price is too high.");

export type ActionState = {
  ok: boolean;
  message?: string;
  error?: string;
  fieldErrors?: Record<string, string[]>;
};

export const idle: ActionState = { ok: false };

/** Collapses a ZodError into the shape the forms render. */
export function fieldErrors(error: z.ZodError): ActionState {
  const flat = z.flattenError(error);
  return {
    ok: false,
    error: "Check the highlighted fields.",
    fieldErrors: flat.fieldErrors as Record<string, string[]>,
  };
}
