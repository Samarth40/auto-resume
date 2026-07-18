import * as React from "react";
import { cn } from "@/lib/utils";

/** Simple controlled tabs (shadcn-style API without Radix). */
const TabsContext = React.createContext(null);

function Tabs({ value, onValueChange, className, children }) {
  return (
    <TabsContext.Provider value={{ value, onValueChange }}>
      <div className={cn(className)}>{children}</div>
    </TabsContext.Provider>
  );
}

function TabsList({ className, ...props }) {
  return (
    <div
      className={cn(
        "inline-flex items-center justify-center gap-1.5 rounded-lg border-2 border-border bg-card p-1.5 shadow-brutal",
        className
      )}
      {...props}
    />
  );
}

function TabsTrigger({ value: triggerValue, className, children, ...props }) {
  const ctx = React.useContext(TabsContext);
  const active = ctx.value === triggerValue;
  return (
    <button
      onClick={() => ctx.onValueChange(triggerValue)}
      data-state={active ? "active" : "inactive"}
      className={cn(
        "inline-flex items-center justify-center gap-1.5 whitespace-nowrap rounded-md border-2 px-3 py-1.5 text-sm font-bold uppercase tracking-wide transition-colors focus-visible:outline-none disabled:pointer-events-none",
        active
          ? "border-border bg-accent text-accent-foreground shadow-brutal-sm"
          : "border-transparent text-muted-foreground hover:text-foreground hover:bg-secondary",
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}

function TabsContent({ value: contentValue, className, children }) {
  const ctx = React.useContext(TabsContext);
  if (ctx.value !== contentValue) return null;
  return <div className={cn("mt-4", className)}>{children}</div>;
}

export { Tabs, TabsList, TabsTrigger, TabsContent };
