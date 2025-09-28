// lib/supabase/server.ts
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

// Für reine Server-Reads reicht der Anon-Key.
// (Schreiben machst du mit supabaseAdmin + Service Role)
export const supabaseServer = createServerClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  {
    cookies: {
      // Cookie lesen (Session)
      get(name: string) {
        return cookies().get(name)?.value;
      },
      // In Server Components dürfen Cookies nicht mutiert werden;
      // für Reads sind No-Op Stubs ok.
      set() {},
      remove() {},
    },
  }
);
