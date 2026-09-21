import { createClient } from "@supabase/supabase-js";

// OJO: este cliente usa la Service Role Key y SOLO debe importarse
// desde código que corre en el servidor (API Routes, Server Components).
// Nunca lo importes desde un archivo con "use client".
if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
  throw new Error("Falta la variable de entorno NEXT_PUBLIC_SUPABASE_URL");
}
if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error("Falta la variable de entorno SUPABASE_SERVICE_ROLE_KEY");
}

export const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);
