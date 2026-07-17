import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Layers } from "lucide-react";

/** Skills Coverage — % of JD skill demands covered, per bucket. */
export default function SkillsCoverage({ analysis }) {
  if (!analysis) return null;
  const buckets = [
    { label: "Required Skills", jd: analysis.requiredSkills },
    { label: "Preferred Skills", jd: analysis.preferredSkills },
    { label: "Languages", jd: analysis.programmingLanguages },
    { label: "Frameworks", jd: analysis.frameworks },
    { label: "Soft Skills", jd: analysis.softSkills },
  ].filter((b) => (b.jd || []).length > 0);

  const matchedSet = new Set((analysis.matchedKeywords || []).map((k) => k.toLowerCase().replace(/\.js$/, "")));
  const norm = (s) => s.toLowerCase().replace(/\.js$/, "");

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Layers className="h-4 w-4 text-primary" />
          Skills Coverage
        </CardTitle>
        <CardDescription>Share of the JD's demands your resume already covers.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {buckets.map((b) => {
          const total = b.jd.length;
          const covered = b.jd.filter((k) => matchedSet.has(norm(k))).length;
          const pct = Math.round((covered / total) * 100);
          return (
            <div key={b.label}>
              <div className="flex justify-between text-sm mb-1.5">
                <span className="font-medium">{b.label}</span>
                <span className="text-muted-foreground tabular-nums">
                  {covered}/{total} · {pct}%
                </span>
              </div>
              <Progress
                value={pct}
                indicatorClassName={pct >= 80 ? "bg-emerald-500" : pct >= 50 ? "bg-amber-500" : "bg-rose-500"}
              />
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
