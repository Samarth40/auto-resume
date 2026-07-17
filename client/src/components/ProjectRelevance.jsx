import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { FolderKanban, TrendingUp } from "lucide-react";
import { scoreColor } from "@/lib/utils";

function barColor(v) {
  if (v >= 80) return "bg-emerald-500";
  if (v >= 60) return "bg-amber-500";
  return "bg-rose-500";
}

/** Project Relevance Scores against the JD. */
export default function ProjectRelevance({ projects = [] }) {
  if (!projects.length) return null;
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <FolderKanban className="h-4 w-4 text-primary" />
          Project Relevance
        </CardTitle>
        <CardDescription>How relevant each project is to this specific role.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {[...projects]
          .sort((a, b) => b.score - a.score)
          .map((p) => (
            <div key={p.title} className="space-y-1.5">
              <div className="flex items-center justify-between gap-2">
                <span className="font-medium text-sm flex items-center gap-1.5">
                  {p.title}
                  {p.score >= 80 && <TrendingUp className="h-3.5 w-3.5 text-emerald-500" />}
                </span>
                <span className={`text-sm font-semibold tabular-nums ${scoreColor(p.score)}`}>
                  {p.score}%
                </span>
              </div>
              <Progress value={p.score} indicatorClassName={barColor(p.score)} />
              <p className="text-xs text-muted-foreground">{p.reason}</p>
            </div>
          ))}
      </CardContent>
    </Card>
  );
}
