// src/design-system/components.ts
//
// Catálogo canônico do design system. Claude (e qualquer dev) só pode COMPOR
// interfaces a partir destes componentes — não desenhar do zero.
//
// status:
//   "ready"   -> implementado em components/ui
//   "planned" -> previsto, ainda não implementado (não usar até existir)

export type ComponentStatus = "ready" | "planned";

export const DESIGN_SYSTEM_COMPONENTS: Record<string, ComponentStatus> = {
  Button: "ready",
  Card: "ready",
  Input: "ready",
  Textarea: "ready",
  Select: "ready",
  Field: "ready",
  Badge: "ready",
  Modal: "ready",
  PageShell: "ready",
  PageHeader: "ready",
  EmptyState: "ready",
  ImageUpload: "ready",

  // Próximos a implementar (não usar antes de existirem):
  Avatar: "planned",
  Dropdown: "planned",
  Tabs: "planned",
  Table: "planned",
  SectionHeader: "planned",
  StatCard: "planned",
  DataTable: "planned",
  ConfirmDialog: "planned",
} as const;

export const READY_COMPONENTS = Object.entries(DESIGN_SYSTEM_COMPONENTS)
  .filter(([, status]) => status === "ready")
  .map(([name]) => name);
