// src/design-system/tokens.ts
//
// Tokens visuais do projeto. Fonte da verdade de cor, espaçamento, raio e
// sombra. Componentes de ui/ devem se basear nestes valores — nunca em cores
// ou espaçamentos arbitrários.

export const colors = {
  background: "bg-slate-50",
  surface: "bg-white",
  surfaceMuted: "bg-slate-100",

  textPrimary: "text-slate-950",
  textSecondary: "text-slate-600",
  textMuted: "text-slate-400",

  border: "border-slate-200",

  primary: "bg-blue-600",
  primaryHover: "hover:bg-blue-700",
  primaryText: "text-white",

  danger: "bg-red-600",
  dangerHover: "hover:bg-red-700",
  dangerText: "text-white",

  warning: "bg-amber-500",
  success: "bg-emerald-600",
} as const;

export const spacing = {
  page: "px-6 py-6",
  section: "space-y-6",
  card: "p-6",
  form: "space-y-4",
  inline: "gap-3",
} as const;

export const radius = {
  sm: "rounded-md",
  md: "rounded-lg",
  lg: "rounded-xl",
  full: "rounded-full",
} as const;

export const shadow = {
  card: "shadow-sm",
  modal: "shadow-xl",
} as const;
