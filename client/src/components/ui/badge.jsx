import * as React from "react";
import { cva } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium transition-colors",
  {
    variants: {
      variant: {
        default: "border-transparent bg-primary/10 text-primary",
        success:
          "border-transparent bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
        warning:
          "border-transparent bg-amber-500/10 text-amber-600 dark:text-amber-400",
        destructive:
          "border-transparent bg-rose-500/10 text-rose-600 dark:text-rose-400",
        outline: "text-foreground",
        secondary: "border-transparent bg-secondary text-secondary-foreground",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

function Badge({ className, variant, ...props }) {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
