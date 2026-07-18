import { motion } from "framer-motion";
import { PlusCircle, Check } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { cn } from "@/lib/utils";

/**
 * Missing-skill review panel — the user ticks the JD skills they genuinely
 * have; only those get ADDED to the resume during optimization.
 */
export default function SkillApproval({ missing = [], approved, onToggle }) {
  if (!missing.length) return null;
  return (
    <Card className="border-primary">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <PlusCircle className="h-4 w-4 text-primary" />
          Add Missing Skills to Your Resume
        </CardTitle>
        <CardDescription>
          The JD wants these, your resume doesn't show them. <b>Tick only the ones you genuinely
          have</b> — ticked skills get added to your skills section, summary, and bullets on the next
          Optimize. Unticked skills are never added.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap gap-2">
          {missing.map((skill, i) => {
            const isOn = approved.has(skill);
            return (
              <motion.button
                key={skill}
                type="button"
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.03 }}
                onClick={() => onToggle(skill)}
                aria-pressed={isOn}
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-md border-2 border-border px-3 py-1.5 text-sm font-bold shadow-brutal-sm transition-colors",
                  isOn
                    ? "bg-emerald-400 text-black dark:bg-emerald-500"
                    : "bg-card text-foreground hover:bg-secondary"
                )}
              >
                {isOn && <Check className="h-3.5 w-3.5" />}
                {skill}
              </motion.button>
            );
          })}
        </div>
        {approved.size > 0 && (
          <p className="mt-3 text-xs font-bold text-emerald-600 dark:text-emerald-400">
            {approved.size} skill{approved.size > 1 ? "s" : ""} will be added on Optimize.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
