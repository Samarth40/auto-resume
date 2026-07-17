import { Moon, Sun, Sparkles, FlaskConical } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export default function Header({ theme, onToggleTheme, mockMode, model }) {
  return (
    <header className="sticky top-0 z-40 border-b bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-6xl items-center gap-3 px-4">
        <div className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Sparkles className="h-4 w-4" />
          </span>
          <div className="leading-tight">
            <h1 className="text-sm font-bold">ResumeAI</h1>
            <p className="text-[10px] text-muted-foreground">Smart ATS Resume Optimizer</p>
          </div>
        </div>
        <div className="ml-auto flex items-center gap-2">
          {mockMode ? (
            <Badge variant="warning" className="hidden sm:inline-flex gap-1">
              <FlaskConical className="h-3 w-3" /> Mock AI — set OPENAI_API_KEY
            </Badge>
          ) : (
            <Badge variant="success" className="hidden sm:inline-flex">{model}</Badge>
          )}
          <Button variant="ghost" size="icon" onClick={onToggleTheme} aria-label="Toggle dark mode">
            {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </Button>
        </div>
      </div>
    </header>
  );
}
