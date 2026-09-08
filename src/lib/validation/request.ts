import { z } from "zod";
import { optionalText, uuidSchema } from "./shared";

export const requestSchema = z
  .object({
    title: z
      .string()
      .trim()
      .min(3, "Give it a title of at least 3 characters.")
      .max(80, "Keep the title under 80 characters."),
    description: z
      .string()
      .trim()
      .min(10, "Say a little more — at least 10 characters.")
      .max(1500, "Keep the description under 1500 characters."),
    categoryId: uuidSchema,
    budgetMin: z.coerce.number().min(0).optional(),
    budgetMax: z.coerce.number().min(0).optional(),
    neededBy: z
      .string()
      .trim()
      .optional()
      .transform((v) => (v ? v : undefined)),
    /** §5.2: 24h, 48h (default) or 7 days. */
    durationHours: z.coerce.number().int().refine((v) => [24, 48, 168].includes(v), {
      message: "Choose 24 hours, 48 hours or 7 days.",
    }),
  })
  .refine(
    (v) =>
      v.budgetMin === undefined ||
      v.budgetMax === undefined ||
      v.budgetMax >= v.budgetMin,
    { message: "Maximum budget must be at least the minimum.", path: ["budgetMax"] },
  );

export const bidSchema = z.object({
  requestId: uuidSchema,
  amount: z.coerce
    .number({ message: "Enter your price." })
    .min(0, "Price cannot be negative.")
    .max(9_999_999, "That price is too high."),
  message: optionalText(500),
  availability: optionalText(40),
  listingId: z
    .string()
    .trim()
    .optional()
    .transform((v) => (v ? v : undefined)),
});
