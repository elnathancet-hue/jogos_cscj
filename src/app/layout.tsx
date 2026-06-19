import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Jogos CSCJ",
  description: "Plataforma SaaS de jogos educativos e culturais.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
