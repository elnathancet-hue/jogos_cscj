// src/lib/design-guard/allowed-classes.ts
//
// Lista de prefixos de classe Tailwind permitidos. O design-guard usa isto para
// distinguir uma classe legítima de uma "inventada". Não é exaustivo das
// utilidades Tailwind — é o subconjunto que o projeto adota.

// Paleta permitida (apenas estas famílias de cor são usadas no projeto).
export const ALLOWED_COLOR_FAMILIES = [
  "slate",
  "blue",
  "red",
  "amber",
  "emerald",
  "white",
  "transparent",
] as const;

// Prefixos utilitários permitidos (layout, espaçamento, tipografia, etc.).
export const ALLOWED_UTILITY_PREFIXES = [
  // layout
  "flex", "grid", "inline-flex", "block", "hidden", "items-", "justify-",
  "gap-", "col-", "row-", "grid-cols-", "grid-rows-", "min-h-", "max-w-",
  "w-", "h-", "mx-", "my-", "mt-", "mb-", "ml-", "mr-", "p-", "px-", "py-",
  "pt-", "pb-", "pl-", "pr-", "space-x-", "space-y-", "absolute", "relative",
  "fixed", "inset-", "z-", "top-", "left-", "right-", "bottom-", "overflow-",
  // aparência
  "bg-", "text-", "border", "border-", "rounded", "rounded-", "shadow",
  "shadow-", "ring-", "ring-offset-", "opacity-", "transition", "transition-",
  // tipografia
  "font-medium", "font-semibold", "font-bold", "tracking-", "leading-",
  "antialiased", "uppercase", "lowercase", "truncate", "text-center",
  "text-left", "text-right",
  // estados / responsivo (prefixos)
  "hover:", "focus:", "focus-visible:", "active:", "disabled:", "sm:", "md:",
  "lg:", "xl:", "dark:",
] as const;
