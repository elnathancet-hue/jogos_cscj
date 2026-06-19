// src/design-system/rules.ts
//
// Regras declarativas do design system. Servem de referência para revisão de
// código e para o design-guard (lib/design-guard).

export const DESIGN_RULES = {
  buttons: {
    rule: "Nunca usar <button> direto em telas. Sempre usar <Button /> de components/ui/Button.",
    allowedVariants: ["primary", "secondary", "ghost", "danger"],
    allowedSizes: ["sm", "md", "lg"],
  },

  colors: {
    rule: "Nunca usar cores arbitrárias como bg-[#...] ou text-[#...]. Usar apenas tokens ou classes já existentes.",
    forbidden: ["bg-[#", "text-[#", "border-[#", "from-[#", "to-[#"],
  },

  spacing: {
    rule: "Usar espaçamentos da escala Tailwind padrão. Evitar valores arbitrários.",
    forbidden: ["p-[", "m-[", "gap-[", "w-[", "h-[", "top-[", "left-["],
  },

  cards: {
    rule: "Toda área em bloco deve usar Card padrão.",
  },

  forms: {
    rule: "Inputs, selects e textarea devem usar componentes de components/ui.",
  },

  pages: {
    rule: "Toda tela de dashboard deve usar PageHeader, container padrão e grid consistente.",
  },
} as const;
