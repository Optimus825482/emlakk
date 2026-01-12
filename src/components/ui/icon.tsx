"use client";

import { cn } from "@/lib/utils";

interface IconProps {
  name: string;
  className?: string;
  filled?: boolean;
}

/**
 * Material Symbols Icon component
 * Uses Google Material Symbols Outlined font
 */
export function Icon({ name, className, filled = false }: IconProps) {
  return (
    <span
      className={cn(
        "material-symbols-outlined",
        filled && "filled-icon",
        className
      )}
    >
      {name}
    </span>
  );
}
