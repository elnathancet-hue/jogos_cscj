// src/components/ui/LinkButton.tsx
//
// Link com a mesma aparência do <Button> — para navegação que parece botão,
// sem usar <a>/<button> "improvisado". Reaproveita os tokens de variante.

import Link from "next/link";

import { cn } from "@/lib/utils";
import {
  buttonVariants,
  buttonSizes,
  type ButtonVariant,
  type ButtonSize,
} from "@/design-system/variants";

type LinkButtonProps = {
  href: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
  className?: string;
  target?: string;
  rel?: string;
  children: React.ReactNode;
};

export function LinkButton({
  href,
  variant = "primary",
  size = "md",
  className,
  target,
  rel,
  children,
}: LinkButtonProps) {
  return (
    <Link
      href={href}
      target={target}
      rel={rel}
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-colors",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2",
        buttonVariants[variant],
        buttonSizes[size],
        className,
      )}
    >
      {children}
    </Link>
  );
}
