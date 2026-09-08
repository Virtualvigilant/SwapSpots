import { z } from "zod";
import { optionalText, uuidSchema } from "./shared";

export const reviewSchema = z.object({
  revieweeId: uuidSchema,
  contextType: z.enum(["listing", "request"]),
  contextId: uuidSchema,
  reviewedRole: z.enum(["seller", "buyer"]),
  rating: z.coerce.number().int().min(1, "Pick a rating.").max(5),
  comment: optionalText(500),
});

export const reportSchema = z.object({
  targetType: z.enum(["listing", "request", "bid", "profile", "review"]),
  targetId: uuidSchema,
  reason: z.string().trim().min(3, "Pick a reason.").max(120),
  details: optionalText(1000),
});

export const verificationSchema = z.object({
  admissionNumber: z
    .string()
    .trim()
    .min(3, "Enter your admission number.")
    .max(40, "That does not look like an admission number."),
  idImagePath: z.string().min(1, "Upload a photo of your student ID."),
});
