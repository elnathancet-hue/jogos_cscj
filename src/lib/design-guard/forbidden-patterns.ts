// src/lib/design-guard/forbidden-patterns.ts
//
// Padrões proibidos no código de telas. Detectados pelo validate-component.

export const FORBIDDEN_PATTERNS = [
  "<button",
  "bg-[#",
  "text-[#",
  "border-[#",
  "from-[#",
  "to-[#",
  "p-[",
  "m-[",
  "gap-[",
  "w-[",
  "h-[",
  "rounded-[",
  "shadow-2xl",
  "style={{",
  "font-[",
] as const;

// Mensagem explicando por que cada padrão é proibido (ajuda na correção).
export const FORBIDDEN_REASONS: Record<string, string> = {
  "<button": "Use <Button /> de @/components/ui/Button.",
  "bg-[#": "Cor arbitrária. Use tokens/classes do design system.",
  "text-[#": "Cor arbitrária. Use tokens/classes do design system.",
  "border-[#": "Cor arbitrária. Use tokens/classes do design system.",
  "from-[#": "Cor arbitrária. Use tokens/classes do design system.",
  "to-[#": "Cor arbitrária. Use tokens/classes do design system.",
  "p-[": "Espaçamento arbitrário. Use a escala Tailwind padrão.",
  "m-[": "Espaçamento arbitrário. Use a escala Tailwind padrão.",
  "gap-[": "Espaçamento arbitrário. Use a escala Tailwind padrão.",
  "w-[": "Tamanho arbitrário. Use a escala Tailwind padrão.",
  "h-[": "Tamanho arbitrário. Use a escala Tailwind padrão.",
  "rounded-[": "Raio arbitrário. Use os tokens de radius.",
  "shadow-2xl": "Sombra fora do design system. Use shadow-sm/shadow-xl.",
  "style={{": "Estilo inline proibido. Use classes do design system.",
  "font-[": "Fonte arbitrária. Use as classes de tipografia padrão.",
};
