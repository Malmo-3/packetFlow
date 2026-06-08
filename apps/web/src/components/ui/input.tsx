import * as React from "react";

import { cn } from "@/lib/utils";

/**
 * Input — Uber-inspired text input.
 *
 * Uses `bg-input` (#efefef canvas-soft) fill with no visible border.
 * The gray fill differentiates from the white page background without a harsh border.
 * Rounded with `rounded-sm` (8px) — slightly softer than square but distinctly
 * different from the pill shape (9999px) reserved for interactive buttons.
 *
 * On white-card surfaces where a slightly lighter fill is needed, apply
 * `className="bg-muted"` to use #f3f3f3 (canvas-softer).
 */
const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-10 w-full rounded-sm border-0 bg-input px-4 py-2 text-sm text-foreground ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
          className,
        )}
        ref={ref}
        {...props}
      />
    );
  },
);
Input.displayName = "Input";

export { Input };
