import type { Metadata } from "next";
import { Card } from "@/components/ui/Card";
import { RegisterForm } from "@/components/auth/RegisterForm";

export const metadata: Metadata = { title: "Criar conta · Jogos CSCJ" };

export default function RegisterPage() {
  return (
    <Card>
      <h2 className="mb-1 text-lg font-semibold text-slate-950">Criar conta</h2>
      <p className="mb-6 text-sm text-slate-600">
        Sua organização é criada automaticamente — você entra como administrador.
      </p>
      <RegisterForm />
    </Card>
  );
}
