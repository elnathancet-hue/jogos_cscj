import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

/**
 * Atualiza/refresca a sessão Supabase em cada request (padrão @supabase/ssr)
 * e protege as rotas:
 *  - sem sessão + rota /dashboard  -> redireciona para /auth/login
 *  - com sessão + rota /auth/*     -> redireciona para /dashboard
 */
export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(
          cookiesToSet: { name: string; value: string; options: Record<string, unknown> }[],
        ) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  // IMPORTANTE: não rode lógica entre createServerClient e getUser().
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const path = request.nextUrl.pathname;

  // Resiliência: se um link de e-mail/OAuth largar o `?code=` em qualquer rota
  // (ex.: na raiz, por fallback da Site URL), encaminha para o callback que
  // troca o código pela sessão.
  const code = request.nextUrl.searchParams.get("code");
  if (code && !path.startsWith("/auth/callback")) {
    const url = request.nextUrl.clone();
    url.pathname = "/auth/callback";
    return NextResponse.redirect(url);
  }

  // Rotas de auth das quais um usuário logado é redirecionado ao dashboard —
  // exceto callback e aceite de convite, que precisam funcionar logado.
  const isAuthRoute =
    path.startsWith("/auth") &&
    !path.startsWith("/auth/callback") &&
    !path.startsWith("/auth/accept-invite");

  if (!user && path.startsWith("/dashboard")) {
    const url = request.nextUrl.clone();
    url.pathname = "/auth/login";
    return NextResponse.redirect(url);
  }

  if (user && isAuthRoute) {
    const url = request.nextUrl.clone();
    url.pathname = "/dashboard";
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}
