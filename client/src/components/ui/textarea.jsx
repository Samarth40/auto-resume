import * as React from "react";
import { cn } from "@/lib/utils";

const Textarea = React.forwardRef(({ className, ...props }, ref) => (
  <textarea
    ref={ref}
    className={cn(
      "flex min-h-[80px] w-full rounded-md border-2 border-border bg-card px-4 py-3 text-sm shadow-brutal-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:shadow-brutal disabled:cursor-not-allowed disabled:opacity-50 resize-none transition-shadow",
      className
    )}
    {...props}
  />
));
Textarea.displayName = "Textarea";

export { Textarea };
