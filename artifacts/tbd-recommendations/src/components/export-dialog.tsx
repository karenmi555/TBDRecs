import { useState } from 'react';
import { useListSuggestions } from '@workspace/api-client-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Download, FileSpreadsheet, FileText, Loader2 } from 'lucide-react';
import { exportToExcel, exportToWord } from '@/lib/export';

export function ExportDialog() {
  const [open, setOpen] = useState(false);
  const [exporting, setExporting] = useState<'excel' | 'word' | null>(null);

  // Fetch all suggestions (no category filter) only when dialog opens
  const { data: suggestions, isLoading } = useListSuggestions(
    {},
    { query: { queryKey: ['suggestions', 'all'], enabled: open } }
  );

  async function handleExcel() {
    if (!suggestions) return;
    setExporting('excel');
    try {
      exportToExcel(suggestions);
    } finally {
      setExporting(null);
    }
  }

  async function handleWord() {
    if (!suggestions) return;
    setExporting('word');
    try {
      await exportToWord(suggestions);
    } finally {
      setExporting(null);
    }
  }

  const ready = !isLoading && !!suggestions;
  const count = suggestions?.length ?? 0;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Download className="w-4 h-4" />
          Export
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Download recommendations</DialogTitle>
          <DialogDescription>
            {isLoading
              ? 'Loading your recommendations…'
              : `${count} recommendation${count !== 1 ? 's' : ''} across all categories`}
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-3 py-2">
          <button
            onClick={handleExcel}
            disabled={!ready || exporting !== null}
            className="flex items-center gap-4 rounded-xl border p-4 text-left transition-colors hover:bg-muted/50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <div className="w-10 h-10 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
              {exporting === 'excel' ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <FileSpreadsheet className="w-5 h-5" />
              )}
            </div>
            <div>
              <div className="font-medium text-sm">Excel spreadsheet</div>
              <div className="text-xs text-muted-foreground mt-0.5">
                One tab per category, sortable columns
              </div>
            </div>
          </button>

          <button
            onClick={handleWord}
            disabled={!ready || exporting !== null}
            className="flex items-center gap-4 rounded-xl border p-4 text-left transition-colors hover:bg-muted/50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <div className="w-10 h-10 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center shrink-0">
              {exporting === 'word' ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <FileText className="w-5 h-5" />
              )}
            </div>
            <div>
              <div className="font-medium text-sm">Word document</div>
              <div className="text-xs text-muted-foreground mt-0.5">
                Formatted list, grouped by category
              </div>
            </div>
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
