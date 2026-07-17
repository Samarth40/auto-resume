import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FileDiff } from "lucide-react";

/** Minimal line diff (LCS-based) for original vs optimized .tex. */
function diffLines(a, b) {
  const A = a.split("\n");
  const B = b.split("\n");
  const n = A.length;
  const m = B.length;
  // LCS table (fine for resume-sized files)
  const dp = Array.from({ length: n + 1 }, () => new Uint16Array(m + 1));
  for (let i = n - 1; i >= 0; i--) {
    for (let j = m - 1; j >= 0; j--) {
      dp[i][j] = A[i] === B[j] ? dp[i + 1][j + 1] + 1 : Math.max(dp[i + 1][j], dp[i][j + 1]);
    }
  }
  const out = [];
  let i = 0;
  let j = 0;
  while (i < n && j < m) {
    if (A[i] === B[j]) {
      out.push({ type: "same", text: A[i] });
      i++;
      j++;
    } else if (dp[i + 1][j] >= dp[i][j + 1]) {
      out.push({ type: "del", text: A[i] });
      i++;
    } else {
      out.push({ type: "add", text: B[j] });
      j++;
    }
  }
  while (i < n) out.push({ type: "del", text: A[i++] });
  while (j < m) out.push({ type: "add", text: B[j++] });
  return out;
}

const LINE_CLASS = {
  same: "text-muted-foreground/80",
  add: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300",
  del: "bg-rose-500/15 text-rose-700 dark:text-rose-300 line-through decoration-rose-400/50",
};

/** Compare Original vs Optimized LaTeX with modified lines highlighted. */
export default function CompareView({ originalTex = "", optimizedTex = "" }) {
  const [mode, setMode] = useState("diff");
  const [changesOnly, setChangesOnly] = useState(true);
  const diff = useMemo(() => diffLines(originalTex, optimizedTex), [originalTex, optimizedTex]);

  const visible = useMemo(() => {
    if (!changesOnly) return diff;
    // show changed lines + 2 lines of context
    const keep = new Set();
    diff.forEach((l, idx) => {
      if (l.type !== "same") {
        for (let k = Math.max(0, idx - 2); k <= Math.min(diff.length - 1, idx + 2); k++) keep.add(k);
      }
    });
    const out = [];
    let lastKept = -2;
    diff.forEach((l, idx) => {
      if (keep.has(idx)) {
        if (idx > lastKept + 1 && out.length) out.push({ type: "gap" });
        out.push(l);
        lastKept = idx;
      }
    });
    return out;
  }, [diff, changesOnly]);

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <CardTitle className="flex items-center gap-2 text-base">
              <FileDiff className="h-4 w-4 text-primary" />
              Original vs Optimized
            </CardTitle>
            <CardDescription className="mt-1">
              LaTeX source diff — <span className="text-emerald-600 dark:text-emerald-400">green added</span>,{" "}
              <span className="text-rose-600 dark:text-rose-400">red removed</span>.
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Tabs value={mode} onValueChange={setMode}>
              <TabsList className="h-8">
                <TabsTrigger value="diff" className="text-xs h-6">Diff</TabsTrigger>
                <TabsTrigger value="original" className="text-xs h-6">Original</TabsTrigger>
                <TabsTrigger value="optimized" className="text-xs h-6">Optimized</TabsTrigger>
              </TabsList>
            </Tabs>
            {mode === "diff" && (
              <label className="flex items-center gap-1.5 text-xs text-muted-foreground cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={changesOnly}
                  onChange={(e) => setChangesOnly(e.target.checked)}
                  className="accent-current"
                />
                Changes only
              </label>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <pre className="max-h-[420px] overflow-auto rounded-lg bg-muted/50 p-3 text-[11px] leading-5 font-mono">
          {mode === "original" && originalTex}
          {mode === "optimized" && optimizedTex}
          {mode === "diff" &&
            visible.map((l, i) =>
              l.type === "gap" ? (
                <div key={i} className="text-center text-muted-foreground/50 select-none">· · ·</div>
              ) : (
                <div key={i} className={`px-1 rounded-sm ${LINE_CLASS[l.type]}`}>
                  {l.type === "add" ? "+ " : l.type === "del" ? "- " : "  "}
                  {l.text || " "}
                </div>
              )
            )}
        </pre>
      </CardContent>
    </Card>
  );
}
