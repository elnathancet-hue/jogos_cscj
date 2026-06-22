// src/lib/auth/session.ts
import "server-only";

import { cache } from "react";

import { createClient } from "@/lib/supabase/server";

/**
 * Usuário autenticado (verificado no servidor), ou null.
 * Memoizado por request (cache) — evita repetir auth.getUser() em layout+page.
 */
export const getCurrentUser = cache(async () => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
});
