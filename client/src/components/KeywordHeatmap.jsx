import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Flame } from "lucide-react";

const SECTIONS = ["summary", "skills", "experience", "projects", "achievements"];
const LABELS = { summary: "Summary", skills: "Skills", experience: "Experience", projects: "Projects", achievements: "Achievements" };

function cellStyle(count, max) {
  if (count === 0) return { backgroundColor: "hsl(var(--muted))", color: "hsl(var(--muted-foreground))" };
  const intensity = Math.min(1, count / Math.max(1, max));
  return {
    backgroundColor: `rgba(99, 102, 241, ${0.15 + intensity * 0.75})`,
    color: intensity > 0.5 ? "#fff" : "hsl(var(--foreground))",
  };
}

/** Keyword × Section frequency heatmap. */
export default function KeywordHeatmap({ heatmap = [] }) {
  if (!heatmap.length) return null;
  const max = Math.max(...heatmap.flatMap((r) => Object.values(r.counts)), 1);
  const rows = [...heatmap].sort((a, b) => b.total - a.total).slice(0, 15);

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Flame className="h-4 w-4 text-orange-500" />
          Keyword Heatmap
        </CardTitle>
        <CardDescription>Where each JD keyword appears across your resume sections.</CardDescription>
      </CardHeader>
      <CardContent className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr>
              <th className="text-left font-medium text-muted-foreground pb-2 pr-3">Keyword</th>
              {SECTIONS.map((s) => (
                <th key={s} className="font-medium text-muted-foreground pb-2 px-1 text-center">
                  {LABELS[s]}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.keyword}>
                <td className="py-1 pr-3 font-medium whitespace-nowrap">{row.keyword}</td>
                {SECTIONS.map((s) => (
                  <td key={s} className="p-0.5">
                    <div
                      className="h-7 min-w-[3rem] rounded-md flex items-center justify-center font-semibold tabular-nums"
                      style={cellStyle(row.counts[s] ?? 0, max)}
                      title={`${row.keyword} × ${LABELS[s]}: ${row.counts[s] ?? 0}`}
                    >
                      {row.counts[s] || ""}
                    </div>
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </CardContent>
    </Card>
  );
}
