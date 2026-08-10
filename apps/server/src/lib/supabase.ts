import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.SUPABASE_PROJECT_URL!;
const SUPABASE_ANON_KEY = process.env.SUPABASE_PUBLISHABLE_KEY!;

export function supabaseForUser(accessToken: string) {
  return createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    global: { headers: { Authorization: `Bearer ${accessToken}` } },
    auth: { persistSession: false },
  });
}