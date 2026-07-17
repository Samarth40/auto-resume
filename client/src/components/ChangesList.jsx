import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { GitCompareArrows, ArrowRight } from "lucide-react";

const SECTION_VARIANT = {
  summary: "default",
  skills: "success",
  projects: "warning",
  achievements: "secondary",
};

/** "Changes Made" list — before/after diff of every AI edit. */
export default function ChangesList({ changes = [] }) {
  if (!changes.length) return null;
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <GitCompareArrows className="h-4 w-4 text-primary" />
          Changes Made
          <Badge className="ml-auto">{changes.length}</Badge>
        </CardTitle>
        <CardDescription>Every modification, with before / after and reasoning.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {changes.map((c, i) => (
          <div key={i} className="rounded-lg border p-3 space-y-2">
            <div className="flex items-center gap-2">
              <Badge variant={SECTION_VARIANT[c.section] || "secondary"} className="capitalize">
                {c.section}
              </Badge>
              <span className="text-xs text-muted-foreground">{c.reason}</span>
            </div>
            <div className="grid gap-2 md:grid-cols-[1fr_auto_1fr] md:items-center">
              <p className="text-xs rounded-md bg-rose-500/10 text-rose-700 dark:text-rose-300 p-2 line-through decoration-rose-400/60">
                {c.before}
              </p>
              <ArrowRight className="h-4 w-4 text-muted-foreground hidden md:block" />
              <p className="text-xs rounded-md bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 p-2">
                {c.after}
              </p>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
