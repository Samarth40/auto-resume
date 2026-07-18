import * as React from "react";
import { cn } from "@/lib/utils";

const Progress = React.forwardRef(({ className, value = 0, indicatorClassName, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("relative h-3.5 w-full overflow-hidden rounded-sm border-2 border-border bg-card", className)}
    {...props}
  >
    <div
      className={cn("h-full bg-primary transition-all duration-700", indicatorClassName)}
      style={{ width: `${Math.max(0, Math.min(100, value))}%` }}
    />
  </div>
));
Progress.displayName = "Progress";

export { Progress };
