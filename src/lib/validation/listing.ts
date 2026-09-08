import { z } from "zod";
import { optionalText, priceSchema, uuidSchema } from "./shared";

export const listingSchema = z.object({
  title: z
    .string()
    .trim()
    .min(3, "Give it a title of at least 3 characters.")
    .max(80, "Keep the title under 80 characters."),
  description: z
    .string()
    .trim()
    .min(10, "Say a little more — at least 10 characters.")
    .max(2000, "Keep the description under 2000 characters."),
  categoryId: uuidSchema,
  price: priceSchema,
  priceType: z.enum(["fixed", "negotiable", "starting_from", "free"]),
  condition: z.enum([
    "new",
    "like_new",
    "good",
    "fair",
    "for_parts",
    "not_applicable",
  ]),
  pickupArea: optionalText(80),
  /** Storage paths from the client upload, already `{user_id}/…`. */
  images: z.array(z.string().min(1)).max(6, "Six images at most."),
});

export type ListingInput = z.infer<typeof listingSchema>;
