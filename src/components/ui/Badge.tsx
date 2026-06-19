// src/components/ui/Badge.tsx

import { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";
import { badgeVariants, type BadgeVariant } from "@/design-system/variants";

type BadgeProps = HTMLAttributes<HTMLSpanElement> & {
  variant?: BadgeVariant;
};

export function Badge({ className, variant = "neutral", ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium",
        badgeVariants[variant],
        className,
      )}
      {...props}
    />
  );
}
