import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { BarChart3 } from "lucide-react";
import { scoreColor } from "@/lib/utils";

const LABELS = {
  summary: "Professional Summary",
  skills: "Skills",
  experience: "Experience",
  projects: "Projects",
  achievements: "Achievements",
};

function barColor(v) {
  if (v >= 80) return "bg-emerald-500";
  if (v >= 60) return "bg-amber-500";
  return "bg-rose-500";
}

/** Section-wise ATS relevance scores. */
export default function SectionScores({ scores = {} }) {
  const entries = Object.entries(LABELS).filter(([k]) => scores[k] != null);
  if (!entries.length) return null;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <BarChart3 className="h-4 w-4 text-primary" />
          Section-wise ATS Score
        </CardTitle>
        <CardDescription>How well each section aligns with the job description.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {entries.map(([key, label]) => (
          <div key={key}>
            <div className="flex justify-between text-sm mb-1.5">
              <span className="font-medium">{label}</span>
              <span className={`font-semibold tabular-nums ${scoreColor(scores[key])}`}>
                {scores[key]}%
              </span>
            </div>
            <Progress value={scores[key]} indicatorClassName={barColor(scores[key])} />
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
