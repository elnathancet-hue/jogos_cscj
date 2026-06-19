import type { Metadata } from "next";
import { Card } from "@/components/ui/Card";
import { ForgotPasswordForm } from "@/components/auth/ForgotPasswordForm";

export const metadata: Metadata = { title: "Recuperar senha · Jogos CSCJ" };

export default function ForgotPasswordPage() {
  return (
    <Card>
      <h2 className="mb-1 text-lg font-semibold text-slate-950">Recuperar senha</h2>
      <p className="mb-6 text-sm text-slate-600">
        Informe seu e-mail e enviaremos as instruções.
      </p>
      <ForgotPasswordForm />
    </Card>
  );
}
