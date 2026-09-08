import { z } from "zod";
import { optionalText, phoneSchema, usernameSchema } from "./shared";

export const onboardingSchema = z.object({
  username: usernameSchema,
  fullName: z
    .string()
    .trim()
    .min(2, "Enter your name.")
    .max(80, "That name is too long."),
  phone: phoneSchema,
  pickupArea: optionalText(80),
});

export const profileUpdateSchema = z.object({
  username: usernameSchema,
  fullName: z.string().trim().min(2, "Enter your name.").max(80),
  phone: phoneSchema,
  bio: optionalText(300),
  pickupArea: optionalText(80),
});

export const signUpSchema = onboardingSchema.extend({
  email: z.email("Enter a valid email address."),
  password: z.string().min(8, "Use at least 8 characters."),
  terms: z.literal("on", { message: "You need to accept the terms to continue." }),
});

export const signInSchema = z.object({
  email: z.email("Enter a valid email address."),
  password: z.string().min(1, "Enter your password."),
});

export const magicLinkSchema = z.object({
  email: z.email("Enter a valid email address."),
});
