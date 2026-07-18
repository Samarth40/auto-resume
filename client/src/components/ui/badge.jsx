import * as React from "react";
import { cva } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-md border-2 border-border px-2 py-0.5 text-xs font-bold shadow-brutal-sm",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground",
        success: "bg-emerald-400 text-black dark:bg-emerald-500",
        warning: "bg-amber-300 text-black dark:bg-amber-400",
        destructive: "bg-rose-400 text-black dark:bg-rose-500",
        outline: "bg-card text-foreground",
        secondary: "bg-secondary text-secondary-foreground",
        accent: "bg-accent text-accent-foreground",
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
