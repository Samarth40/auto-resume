import { motion } from "framer-motion";
import { Search, Wand2, RotateCcw, FileText, ShieldCheck, Zap, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const FEATURES = [
  {
    icon: FileText,
    title: "Master resume, built in",
    desc: "Your LaTeX resume lives on the server. No uploads — it's the single source of truth.",
  },
  {
    icon: ShieldCheck,
    title: "Truth-locked AI",
    desc: "The AI can only rewrite, reorder, and rephrase. It can never invent skills or experience.",
  },
  {
    icon: Zap,
    title: "ATS-ready output",
    desc: "Get a match score, keyword gaps, and a freshly compiled PDF in seconds.",
  },
];

export default function HomePage({
  jd,
  setJd,
  onAnalyze,
  onOptimize,
  onReset,
  loading,
  resumeName,
}) {
  const disabled = jd.trim().length < 40;

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="text-center"
      >
        <Badge className="mb-4">AI-powered · ATS-optimized · 100% truthful</Badge>
        <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight">
          Beat the ATS.{" "}
          <span className="bg-gradient-to-r from-indigo-500 via-violet-500 to-fuchsia-500 bg-clip-text text-transparent">
            Keep the truth.
          </span>
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-muted-foreground">
          Paste a job description below. ResumeAI analyzes {resumeName ? <b>{resumeName}'s</b> : "your"} master
          resume against it, then rewrites only what's allowed — summary, skill ordering, and bullet wording.
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.15 }}
        className="mt-10"
      >
        <Card className="shadow-lg">
          <CardContent className="p-4 sm:p-6">
            <label htmlFor="jd" className="mb-2 block text-sm font-semibold">
              Job Description
            </label>
            <Textarea
              id="jd"
              value={jd}
              onChange={(e) => setJd(e.target.value)}
              placeholder="Paste the full job description here — responsibilities, requirements, tech stack, everything…"
              className="min-h-[260px] text-sm leading-6"
              disabled={loading !== null}
            />
            <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
              <span>{jd.trim().length.toLocaleString()} characters {disabled && jd.trim().length > 0 && "· need at least 40"}</span>
              <span>⌘/Ctrl + Enter to analyze</span>
            </div>

            <div className="mt-5 flex flex-wrap gap-3">
              <Button size="lg" onClick={onAnalyze} disabled={disabled || loading !== null} className="flex-1 sm:flex-none">
                {loading === "analyze" ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Search className="h-4 w-4" />
                )}
                {loading === "analyze" ? "Analyzing…" : "Analyze Resume"}
              </Button>
              <Button
                size="lg"
                variant="secondary"
                onClick={onOptimize}
                disabled={disabled || loading !== null}
                className="flex-1 sm:flex-none border border-primary/30"
              >
                {loading === "optimize" ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Wand2 className="h-4 w-4" />
                )}
                {loading === "optimize" ? "Optimizing…" : "Optimize Resume"}
              </Button>
              <Button size="lg" variant="ghost" onClick={onReset} disabled={loading !== null}>
                <RotateCcw className="h-4 w-4" />
                Reset
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      <div className="mt-12 grid gap-4 sm:grid-cols-3">
        {FEATURES.map((f, i) => (
          <motion.div
            key={f.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.3 + i * 0.1 }}
          >
            <Card className="h-full">
              <CardContent className="p-5">
                <f.icon className="h-5 w-5 text-primary" />
                <h3 className="mt-3 text-sm font-semibold">{f.title}</h3>
                <p className="mt-1 text-xs text-muted-foreground leading-5">{f.desc}</p>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
