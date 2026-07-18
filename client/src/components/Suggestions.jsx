import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Lightbulb } from "lucide-react";
import { motion } from "framer-motion";

/** AI Suggestions list. */
export default function Suggestions({ suggestions = [] }) {
  if (!suggestions.length) return null;
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Lightbulb className="h-4 w-4 text-amber-500" />
          AI Suggestions
        </CardTitle>
        <CardDescription>Truthful ways to improve alignment with this role.</CardDescription>
      </CardHeader>
      <CardContent>
        <ul className="space-y-2.5">
          {suggestions.map((s, i) => (
            <motion.li
              key={i}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.06 }}
              className="flex gap-2.5 text-sm"
            >
              <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-sm border-2 border-border bg-accent text-accent-foreground text-xs font-bold shadow-brutal-sm">
                {i + 1}
              </span>
              <span>{s}</span>
            </motion.li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
