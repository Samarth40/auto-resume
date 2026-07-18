import { useState } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, Wand2, Download, Loader2, BarChart3, FileText, GitCompareArrows, History } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import ScoreRing from "@/components/ScoreRing";
import KeywordPanel from "@/components/KeywordPanel";
import KeywordHeatmap from "@/components/KeywordHeatmap";
import SectionScores from "@/components/SectionScores";
import ProjectRelevance from "@/components/ProjectRelevance";
import SkillGaps from "@/components/SkillGaps";
import SkillsCoverage from "@/components/SkillsCoverage";
import Suggestions from "@/components/Suggestions";
import ChangesList from "@/components/ChangesList";
import CompareView from "@/components/CompareView";
import PdfPreview from "@/components/PdfPreview";
import VersionHistory from "@/components/VersionHistory";
import SkillApproval from "@/components/SkillApproval";
import { api } from "@/lib/api";

export default function ResultsPage({ result, onBack, onOptimize, loading, versionKey, approvedSkills, onToggleSkill }) {
  const [tab, setTab] = useState("analysis");
  const { analysis, optimization, heatmap, originalTex, optimizedTex, pdf } = result;
  const optimized = Boolean(optimization);
  const score = optimized ? optimization.atsScore : analysis.atsScore;
  const scoreDelta = optimized ? optimization.atsScore - analysis.atsScore : 0;

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <div className="flex flex-wrap items-center gap-3">
        <Button variant="ghost" size="sm" onClick={onBack}>
          <ArrowLeft className="h-4 w-4" /> New analysis
        </Button>
        <div className="ml-auto flex flex-wrap gap-2">
          {!optimized && (
            <Button size="sm" onClick={onOptimize} disabled={loading !== null}>
              {loading === "optimize" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Wand2 className="h-4 w-4" />}
              {loading === "optimize" ? "Optimizing…" : "Optimize Resume"}
            </Button>
          )}
          {optimized && approvedSkills?.size > 0 && (
            <Button size="sm" onClick={onOptimize} disabled={loading !== null}>
              {loading === "optimize" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Wand2 className="h-4 w-4" />}
              {loading === "optimize" ? "Optimizing…" : `Re-optimize (+${approvedSkills.size} skills)`}
            </Button>
          )}
          {optimized && (
            <>
              {pdf?.ready && (
                <Button size="sm" onClick={() => window.open(api.downloadUrl("pdf"), "_blank")}>
                  <Download className="h-4 w-4" /> PDF
                </Button>
              )}
              <Button size="sm" variant="secondary" onClick={() => window.open(api.downloadUrl("tex"), "_blank")}>
                <Download className="h-4 w-4" /> TEX
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Score hero */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="mt-6"
      >
        <Card>
          <CardContent className="flex flex-col items-center gap-6 p-6 md:flex-row md:justify-around">
            <ScoreRing
              score={score}
              label={optimized ? "After optimization" : "Current resume vs this JD"}
            />
            <div className="grid grid-cols-2 gap-x-10 gap-y-4 text-center md:text-left">
              <Stat label="Matched keywords" value={(optimized ? optimization.matchedKeywords : analysis.matchedKeywords)?.length ?? 0} tone="text-emerald-500" />
              <Stat label="Missing keywords" value={(optimized ? optimization.missingKeywords : analysis.missingKeywords)?.length ?? 0} tone="text-rose-500" />
              {optimized ? (
                <>
                  <Stat label="Changes made" value={optimization.changes?.length ?? 0} tone="text-primary" />
                  <Stat
                    label="Score improvement"
                    value={`${scoreDelta >= 0 ? "+" : ""}${scoreDelta}`}
                    tone={scoreDelta >= 0 ? "text-emerald-500" : "text-rose-500"}
                  />
                </>
              ) : (
                <>
                  <Stat label="Required skills in JD" value={analysis.requiredSkills?.length ?? 0} tone="text-primary" />
                  <Stat label="Suggestions" value={analysis.suggestions?.length ?? 0} tone="text-amber-500" />
                </>
              )}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Tabs */}
      <div className="mt-6">
        <Tabs value={tab} onValueChange={setTab}>
          <TabsList className="flex-wrap h-auto">
            <TabsTrigger value="analysis">
              <BarChart3 className="h-3.5 w-3.5" /> Analysis
            </TabsTrigger>
            {optimized && (
              <>
                <TabsTrigger value="resume">
                  <FileText className="h-3.5 w-3.5" /> Resume
                </TabsTrigger>
                <TabsTrigger value="compare">
                  <GitCompareArrows className="h-3.5 w-3.5" /> Compare
                </TabsTrigger>
              </>
            )}
            <TabsTrigger value="history">
              <History className="h-3.5 w-3.5" /> History
            </TabsTrigger>
          </TabsList>

          <TabsContent value="analysis" className="space-y-4">
            <SkillApproval
              missing={optimized ? optimization.missingKeywords : analysis.missingKeywords}
              approved={approvedSkills}
              onToggle={onToggleSkill}
            />
            <KeywordPanel
              matched={optimized ? optimization.matchedKeywords : analysis.matchedKeywords}
              missing={optimized ? optimization.missingKeywords : analysis.missingKeywords}
            />
            <div className="grid gap-4 lg:grid-cols-2">
              <SectionScores scores={analysis.sectionScores} />
              <SkillsCoverage analysis={analysis} />
            </div>
            <div className="grid gap-4 lg:grid-cols-2">
              <ProjectRelevance projects={analysis.projectRelevance} />
              <SkillGaps gaps={analysis.skillGaps} />
            </div>
            <KeywordHeatmap heatmap={heatmap} />
            <Suggestions suggestions={analysis.suggestions} />
            {optimized && <ChangesList changes={optimization.changes} />}
          </TabsContent>

          {optimized && (
            <TabsContent value="resume">
              <PdfPreview pdfReady={pdf?.ready} pdfError={pdf?.error} />
            </TabsContent>
          )}

          {optimized && (
            <TabsContent value="compare">
              <CompareView originalTex={originalTex} optimizedTex={optimizedTex} />
            </TabsContent>
          )}

          <TabsContent value="history">
            <VersionHistory refreshKey={versionKey} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

function Stat({ label, value, tone }) {
  return (
    <div>
      <p className={`text-3xl font-extrabold tabular-nums ${tone}`}>{value}</p>
      <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
    </div>
  );
}
