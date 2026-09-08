/**
 * Environment access, validated once at module load.
 *
 * A missing Supabase URL fails as `undefined` deep inside a fetch otherwise,
 * which is a miserable thing to debug on a fresh clone or a first deploy.
 */
function required(name: string, value: string | undefined): string {
  if (!value) {
    throw new Error(
      `Missing ${name}. Copy it from Supabase → Project Settings → API into .env.local.`,
    );
  }
  return value;
}

export const env = {
  supabaseUrl: required(
    "NEXT_PUBLIC_SUPABASE_URL",
    process.env.NEXT_PUBLIC_SUPABASE_URL,
  ),
  supabaseAnonKey: required(
    "NEXT_PUBLIC_SUPABASE_ANON_KEY",
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  ),
};
