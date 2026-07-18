import { useEffect, useState, useCallback } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Toaster, toast } from "sonner";
import Header from "@/components/Header";
import HomePage from "@/pages/HomePage";
import ResultsPage from "@/pages/ResultsPage";
import { useTheme } from "@/hooks/useTheme";
import { api } from "@/lib/api";

export default function App() {
  const { theme, toggle } = useTheme();
  const [jd, setJd] = useState("");
  const [loading, setLoading] = useState(null); // null | "analyze" | "optimize"
  const [result, setResult] = useState(null);
  const [health, setHealth] = useState({ mockMode: true, model: "" });
  const [versionKey, setVersionKey] = useState(0);
  const [resumeName, setResumeName] = useState("");
  // Missing JD skills the user confirmed having — only these may be ADDED
  const [approvedSkills, setApprovedSkills] = useState(new Set());

  const toggleApprovedSkill = useCallback((skill) => {
    setApprovedSkills((prev) => {
      const next = new Set(prev);
      if (next.has(skill)) next.delete(skill);
      else next.add(skill);
      return next;
    });
  }, []);

  useEffect(() => {
    api.health().then(setHealth).catch(() => {
      toast.error("Cannot reach the server. Is it running on port 5050?");
    });
    api
      .getResume()
      .then((d) => {
        // first word of the plain header is the candidate's name; keep it simple
        const name = d.tex?.match(/\\Huge \\scshape ([^}]+)\}/)?.[1]?.trim();
        if (name) setResumeName(name.split(" ")[0]);
      })
      .catch((e) => toast.error(e.message));
  }, []);

  const handleAnalyze = useCallback(async () => {
    setLoading("analyze");
    try {
      const data = await api.analyze(jd);
      setResult({ ...data, optimization: null });
      setApprovedSkills(new Set()); // fresh JD → fresh approvals
      toast.success(`Analysis complete — ATS score ${data.analysis.atsScore}/100`);
    } catch (e) {
      toast.error(e.message);
    } finally {
      setLoading(null);
    }
  }, [jd]);

  const handleOptimize = useCallback(async () => {
    setLoading("optimize");
    const t = toast.loading("Optimizing resume — rewriting sections, compiling PDF…");
    try {
      const data = await api.optimize(jd, result?.analysis, [...approvedSkills]);
      setResult(data);
      setVersionKey((k) => k + 1);
      toast.dismiss(t);
      if (data.pdf?.ready) {
        toast.success(`Optimized! New ATS score ${data.optimization.atsScore}/100 · PDF ready`);
      } else {
        toast.warning("Optimized .tex generated — PDF compilation unavailable (install pdflatex).");
      }
    } catch (e) {
      toast.dismiss(t);
      toast.error(e.message);
    } finally {
      setLoading(null);
    }
  }, [jd, result, approvedSkills]);

  const handleReset = useCallback(() => {
    setJd("");
    setResult(null);
    setApprovedSkills(new Set());
    toast.info("Cleared. Paste a new job description to start again.");
  }, []);

  // ⌘/Ctrl+Enter shortcut on home page
  useEffect(() => {
    const onKey = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "Enter" && !result && jd.trim().length >= 40 && !loading) {
        handleAnalyze();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [jd, result, loading, handleAnalyze]);

  return (
    <div className="min-h-screen">
      <Toaster richColors position="top-right" theme={theme} />
      <Header theme={theme} onToggleTheme={toggle} mockMode={health.mockMode} model={health.model} />
      <AnimatePresence mode="wait">
        {result ? (
          <motion.main
            key="results"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
          >
            <ResultsPage
              result={result}
              onBack={() => setResult(null)}
              onOptimize={handleOptimize}
              loading={loading}
              versionKey={versionKey}
              approvedSkills={approvedSkills}
              onToggleSkill={toggleApprovedSkill}
            />
          </motion.main>
        ) : (
          <motion.main
            key="home"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
          >
            <HomePage
              jd={jd}
              setJd={setJd}
              onAnalyze={handleAnalyze}
              onOptimize={handleOptimize}
              onReset={handleReset}
              loading={loading}
              resumeName={resumeName}
            />
          </motion.main>
        )}
      </AnimatePresence>
      <footer className="border-t py-6 text-center text-xs text-muted-foreground">
        ResumeAI · The AI never invents experience — truthfulness &gt; ATS score.
      </footer>
    </div>
  );
}
