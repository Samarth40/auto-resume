import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Target } from "lucide-react";

const IMPORTANCE_VARIANT = {
  critical: "destructive",
  important: "warning",
  "nice-to-have": "secondary",
};

/** Skill Gap Analysis — missing skills ranked by importance, with honest suggestions. */
export default function SkillGaps({ gaps = [] }) {
  if (!gaps.length) return null;
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Target className="h-4 w-4 text-primary" />
          Skill Gap Analysis
        </CardTitle>
        <CardDescription>
          Skills the JD wants that your resume doesn't show — with truthful next steps.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {gaps.map((g) => (
          <div key={g.skill} className="flex items-start gap-3 rounded-md border-2 border-border p-3 shadow-brutal-sm bg-card">
            <Badge variant={IMPORTANCE_VARIANT[g.importance] || "secondary"} className="mt-0.5 shrink-0 capitalize">
              {g.importance}
            </Badge>
            <div className="min-w-0">
              <p className="font-medium text-sm">{g.skill}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{g.suggestion}</p>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
