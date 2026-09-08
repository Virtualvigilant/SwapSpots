import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * OAuth / magic-link landing route.
 *
 * Exchanges the `code` in the query string for a session cookie, then forwards.
 * A user who lands here with no profile row goes to settings, which renders the
 * onboarding form — otherwise they would bounce around /me hitting redirects.
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/browse";

  // Only ever redirect within this origin — an open redirect here would be a
  // credential-phishing vector.
  const target = next.startsWith("/") && !next.startsWith("//") ? next : "/browse";

  if (!code) {
    return NextResponse.redirect(
      new URL("/sign-in?error=missing_code", origin),
    );
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    return NextResponse.redirect(
      new URL(`/sign-in?error=${encodeURIComponent(error.message)}`, origin),
    );
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("id")
      .eq("id", user.id)
      .maybeSingle();

    if (!profile) {
      return NextResponse.redirect(new URL("/me/settings", origin));
    }
  }

  return NextResponse.redirect(new URL(target, origin));
}
