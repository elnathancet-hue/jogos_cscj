export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-12">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <h1 className="text-xl font-semibold tracking-tight text-slate-950">
            Jogos CSCJ
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            Plataforma de jogos educativos e culturais
          </p>
        </div>
        {children}
      </div>
    </main>
  );
}
