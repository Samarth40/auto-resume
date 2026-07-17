import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { History, Clock } from "lucide-react";
import { api } from "@/lib/api";
import { scoreColor } from "@/lib/utils";

/** Version History of optimization runs. */
export default function VersionHistory({ refreshKey = 0 }) {
  const [versions, setVersions] = useState([]);

  useEffect(() => {
    api.versions().then((d) => setVersions(d.versions || [])).catch(() => {});
  }, [refreshKey]);

  if (!versions.length) return null;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <History className="h-4 w-4 text-primary" />
          Version History
          <Badge variant="secondary" className="ml-auto">{versions.length}</Badge>
        </CardTitle>
        <CardDescription>Every optimization run is saved on the server.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-2">
        {versions.slice(0, 8).map((v) => (
          <div key={v.id} className="flex items-center gap-3 rounded-lg border p-3 text-sm">
            <Clock className="h-4 w-4 text-muted-foreground shrink-0" />
            <div className="min-w-0 flex-1">
              <p className="font-medium">{new Date(v.createdAt).toLocaleString()}</p>
              <p className="text-xs text-muted-foreground truncate">{v.jobDescriptionPreview}</p>
            </div>
            <div className="text-right shrink-0">
              <p className={`font-bold tabular-nums ${scoreColor(v.atsScore)}`}>{v.atsScore}</p>
              <p className="text-[10px] text-muted-foreground">{v.changesCount} changes</p>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
