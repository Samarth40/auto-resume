import { motion } from "framer-motion";
import { CheckCircle2, XCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.03 } },
};
const item = {
  hidden: { opacity: 0, y: 6 },
  show: { opacity: 1, y: 0 },
};

export default function KeywordPanel({ matched = [], missing = [] }) {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
            Matching Keywords
            <Badge variant="success" className="ml-auto">{matched.length}</Badge>
          </CardTitle>
          <CardDescription>Found in your resume — you're covered here.</CardDescription>
        </CardHeader>
        <CardContent>
          {matched.length === 0 ? (
            <p className="text-sm text-muted-foreground">No matches detected.</p>
          ) : (
            <motion.div variants={container} initial="hidden" animate="show" className="flex flex-wrap gap-1.5">
              {matched.map((kw) => (
                <motion.span key={kw} variants={item}>
                  <Badge variant="success">{kw}</Badge>
                </motion.span>
              ))}
            </motion.div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <XCircle className="h-4 w-4 text-rose-500" />
            Missing Keywords
            <Badge variant="destructive" className="ml-auto">{missing.length}</Badge>
          </CardTitle>
          <CardDescription>
            In the JD but not your resume. Only add ones you genuinely have.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {missing.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nothing missing — great coverage! 🎉</p>
          ) : (
            <motion.div variants={container} initial="hidden" animate="show" className="flex flex-wrap gap-1.5">
              {missing.map((kw) => (
                <motion.span key={kw} variants={item}>
                  <Badge variant="destructive">{kw}</Badge>
                </motion.span>
              ))}
            </motion.div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
