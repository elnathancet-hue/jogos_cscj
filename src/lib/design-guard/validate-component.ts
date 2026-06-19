// src/lib/design-guard/validate-component.ts
//
// Validador do design system. Recebe o código-fonte de uma TELA e aponta
// violações (botões manuais, cores/espaçamentos arbitrários, estilo inline...).
//
// IMPORTANTE: rode isto contra telas (app/**, components de feature) — NÃO
// contra as definições do próprio design system (components/ui, design-system),
// que legitimamente contêm <button>, shadow-xl, etc.

import { FORBIDDEN_PATTERNS, FORBIDDEN_REASONS } from "./forbidden-patterns";

export type DesignViolation = {
  pattern: string;
  reason: string;
  line: number;
  column: number;
  snippet: string;
};

/** Retorna todas as violações de design encontradas no código. */
export function validateComponent(source: string): DesignViolation[] {
  const violations: DesignViolation[] = [];
  const lines = source.split("\n");

  lines.forEach((text, i) => {
    for (const pattern of FORBIDDEN_PATTERNS) {
      let from = 0;
      let idx = text.indexOf(pattern, from);
      while (idx !== -1) {
        violations.push({
          pattern,
          reason: FORBIDDEN_REASONS[pattern] ?? "Padrão proibido pelo design system.",
          line: i + 1,
          column: idx + 1,
          snippet: text.trim(),
        });
        from = idx + pattern.length;
        idx = text.indexOf(pattern, from);
      }
    }
  });

  return violations;
}

/** true se o código respeita o design system. */
export function isValidComponent(source: string): boolean {
  return validateComponent(source).length === 0;
}

/** Lança erro com o relatório de violações — útil em testes/CI. */
export function assertValidComponent(source: string, file = "componente"): void {
  const violations = validateComponent(source);
  if (violations.length === 0) return;

  const relatorio = violations
    .map((v) => `  ${file}:${v.line}:${v.column}  "${v.pattern}" — ${v.reason}`)
    .join("\n");

  throw new Error(
    `Design system: ${violations.length} violação(ões) em ${file}:\n${relatorio}`,
  );
}
