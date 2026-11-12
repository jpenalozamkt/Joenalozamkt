import "server-only";
import { createClient } from "@supabase/supabase-js";
import { env } from "@/lib/env";

/** Cliente con la llave de servicio. Solo para acciones del servidor ya validadas (crear usuarios, etc.). */
export function supabaseAdmin() {
  return createClient(env.url(), env.serviceKey(), {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
