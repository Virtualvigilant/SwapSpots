"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import {
  signInSchema,
  signUpSchema,
  magicLinkSchema,
} from "@/lib/validation/profile";
import { fieldErrors, type ActionState } from "@/lib/validation/shared";

function safeNext(value: FormDataEntryValue | null): string {
  const next = typeof value === "string" ? value : "";
  // Never redirect off-origin — an open redirect here is a phishing vector.
  return next.startsWith("/") && !next.startsWith("//") ? next : "/browse";
}

export async function signIn(
  _prev: ActionState | null,
  formData: FormData,
): Promise<ActionState> {
  const parsed = signInSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) return fieldErrors(parsed.error);

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword(parsed.data);

  if (error) {
    return {
      ok: false,
      error:
        error.message === "Invalid login credentials"
          ? "That email and password do not match."
          : error.message,
    };
  }

  revalidatePath("/", "layout");
  redirect(safeNext(formData.get("next")));
}

export async function signUp(
  _prev: ActionState | null,
  formData: FormData,
): Promise<ActionState> {
  const parsed = signUpSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
    username: formData.get("username"),
    fullName: formData.get("fullName"),
    phone: formData.get("phone"),
    terms: formData.get("terms"),
  });
  if (!parsed.success) return fieldErrors(parsed.error);

  const supabase = await createClient();

  // The username is unique at the database level, but finding that out via a
  // 23505 *after* creating an auth user leaves an orphan account behind.
  const { data: taken } = await supabase
    .from("profiles")
    .select("id")
    .eq("username", parsed.data.username)
    .maybeSingle();

  if (taken) {
    return {
      ok: false,
      error: "That username is taken.",
      fieldErrors: { username: ["That username is taken."] },
    };
  }

  const origin = (await headers()).get("origin") ?? "";
  const { data, error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: {
      emailRedirectTo: `${origin}/callback`,
      // handle_new_user() reads these to create the profile row (§6.3).
      data: {
        username: parsed.data.username,
        full_name: parsed.data.fullName,
        phone_e164: parsed.data.phone,
        campus_slug: "kabarak",
      },
    },
  });

  if (error) return { ok: false, error: error.message };

  // With email confirmation on, there is no session yet — say so rather than
  // bouncing to a page that will redirect straight back to sign-in.
  if (!data.session) {
    return {
      ok: true,
      message: `Check ${parsed.data.email} for a confirmation link to finish signing up.`,
    };
  }

  revalidatePath("/", "layout");
  redirect("/browse");
}

export async function sendMagicLink(
  _prev: ActionState | null,
  formData: FormData,
): Promise<ActionState> {
  const parsed = magicLinkSchema.safeParse({ email: formData.get("email") });
  if (!parsed.success) return fieldErrors(parsed.error);

  const origin = (await headers()).get("origin") ?? "";
  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithOtp({
    email: parsed.data.email,
    options: { emailRedirectTo: `${origin}/callback` },
  });

  if (error) return { ok: false, error: error.message };
  return {
    ok: true,
    message: `Sign-in link sent to ${parsed.data.email}. It expires in an hour.`,
  };
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath("/", "layout");
  redirect("/");
}
