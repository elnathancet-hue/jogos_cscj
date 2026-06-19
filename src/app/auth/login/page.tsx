import type { Metadata } from "next";
import { Card } from "@/components/ui/Card";
import { LoginForm } from "@/components/auth/LoginForm";

export const metadata: Metadata = { title: "Entrar · Jogos CSCJ" };

export default function LoginPage() {
  return (
    <Card>
      <h2 className="mb-1 text-lg font-semibold text-slate-950">Entrar</h2>
      <p className="mb-6 text-sm text-slate-600">Acesse o painel da sua organização.</p>
      <LoginForm />
    </Card>
  );
}
