import * as React from "react";
import { cn } from "@/lib/utils";

function Skeleton({ className, ...props }) {
  return <div className={cn("animate-pulse rounded-md border-2 border-border/30 bg-muted", className)} {...props} />;
}

export { Skeleton };
