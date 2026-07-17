import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, Download, RefreshCw, AlertTriangle } from "lucide-react";
import { api } from "@/lib/api";

/** In-app PDF preview with download buttons. */
export default function PdfPreview({ pdfReady, pdfError }) {
  const [src, setSrc] = useState(pdfReady ? api.previewPdfUrl() : null);

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <CardTitle className="flex items-center gap-2 text-base">
              <FileText className="h-4 w-4 text-primary" />
              Optimized Resume
            </CardTitle>
            <CardDescription className="mt-1">Preview and download the generated files.</CardDescription>
          </div>
          <div className="flex flex-wrap gap-2">
            {pdfReady && (
              <>
                <Button size="sm" variant="outline" onClick={() => setSrc(api.previewPdfUrl())}>
                  <RefreshCw className="h-3.5 w-3.5" /> Refresh
                </Button>
                <Button size="sm" onClick={() => window.open(api.downloadUrl("pdf"), "_blank")}>
                  <Download className="h-3.5 w-3.5" /> Download PDF
                </Button>
              </>
            )}
            <Button size="sm" variant="secondary" onClick={() => window.open(api.downloadUrl("tex"), "_blank")}>
              <Download className="h-3.5 w-3.5" /> Download TEX
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {pdfReady && src ? (
          <iframe
            title="Optimized Resume PDF"
            src={src}
            className="w-full h-[560px] rounded-lg border bg-white"
          />
        ) : (
          <div className="flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed p-10 text-center">
            <AlertTriangle className="h-8 w-8 text-amber-500" />
            <p className="text-sm font-medium">PDF not generated</p>
            <p className="text-xs text-muted-foreground max-w-md">
              {pdfError ||
                "pdflatex was not available on the server. The optimized .tex file is still ready to download — compile it on Overleaf or install MiKTeX/TeX Live."}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
