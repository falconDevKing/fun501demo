import { createClient } from "@supabase/supabase-js";

let supabaseBrowser: ReturnType<typeof createClient> | null = null;

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

function readPublicEnv(value: string | undefined, name: string) {
  if (!value) {
    throw new Error(
      `Missing required environment variable: ${name}. Restart the dev server after updating .env.local or .env.`,
    );
  }

  return value;
}

export function getSupabaseBrowser() {
  if (supabaseBrowser) {
    return supabaseBrowser;
  }

  supabaseBrowser = createClient(
    readPublicEnv(supabaseUrl, "NEXT_PUBLIC_SUPABASE_URL"),
    readPublicEnv(supabaseAnonKey, "NEXT_PUBLIC_SUPABASE_ANON_KEY"),
  );

  return supabaseBrowser;
}
