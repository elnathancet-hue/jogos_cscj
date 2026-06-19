// src/lib/auth/session.ts
import "server-only";

import { createClient } from "@/lib/supabase/server";

/** Usuário autenticado (verificado no servidor), ou null. */
export async function getCurrentUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}
