import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import type { Database } from "@/types/database";
import { env } from "@/lib/env";

/** Signed-in-only areas. `/me` and `/admin` also gate on role below. */
const PROTECTED = ["/me", "/admin", "/listings/new", "/requests/new"];

/**
 * Refreshes the auth cookie on every request and guards the private routes.
 *
 * The guard here is convenience — it produces a redirect instead of an empty
 * page. RLS is the actual boundary (§7); nothing on the other side of this
 * check is trusted because it got past it.
 */
export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient<Database>(
    env.supabaseUrl,
    env.supabaseAnonKey,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          for (const { name, value } of cookiesToSet) {
            request.cookies.set(name, value);
          }
          response = NextResponse.next({ request });
          for (const { name, value, options } of cookiesToSet) {
            response.cookies.set(name, value, options);
          }
        },
      },
    },
  );

  // getUser(), not getSession(): it revalidates the token with Supabase rather
  // than trusting whatever the cookie claims.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;
  const needsAuth = PROTECTED.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`),
  );

  if (needsAuth && !user) {
    const url = request.nextUrl.clone();
    url.pathname = "/sign-in";
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  if (pathname.startsWith("/admin") && user) {
    const { data: staff } = await supabase.rpc("is_staff");
    if (!staff) {
      const url = request.nextUrl.clone();
      url.pathname = "/browse";
      url.search = "";
      return NextResponse.redirect(url);
    }
  }

  // Return `response` itself. Building a new one drops the refreshed cookies
  // and logs the user out at random.
  return response;
}
