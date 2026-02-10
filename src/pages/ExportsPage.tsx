import { useMemo, useState } from 'react';
import { useApp } from '@/context/AppContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { formatQuarter, getConfidenceLabel } from '@/types';
import { FileSpreadsheet, Presentation, Download, Copy, Check, Sparkles, TrendingUp, BookOpen } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { generateQBRPresentation } from '@/lib/qbrExport';

export function ExportsPage() {
  const { toast } = useToast();
  const { currentQuarter, getOKRsByQuarter, checkIns, productAreas } = useApp();
  
  const [copiedTable, setCopiedTable] = useState(false);
  const [copiedSummary, setCopiedSummary] = useState(false);
  const [copiedReview, setCopiedReview] = useState(false);
  const [isGeneratingPptx, setIsGeneratingPptx] = useState(false);

  const quarterOKRs = useMemo(() => {
    return getOKRsByQuarter(currentQuarter);
  }, [currentQuarter, getOKRsByQuarter]);

  const generateCSV = () => {
    const headers = ['Objective', 'Level', 'Owner', 'Progress', 'Confidence', 'Label', 'Trend', 'Last Check-in'];
    const rows = quarterOKRs.map(okr => [
      `"${okr.objectiveText}"`,
      okr.level,
      `"${okr.ownerName}"`,
      okr.latestCheckIn?.progress || 0,
      okr.latestCheckIn?.confidence || 0,
      okr.latestCheckIn?.confidenceLabel || 'N/A',
      okr.trend,
      okr.latestCheckIn?.date || 'N/A'
    ]);
    
    return [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
  };

  const generateTable = () => {
    const headers = ['Objective', 'Owner', 'Progress', 'Confidence', 'Trend'];
    const rows = quarterOKRs.map(okr => [
      okr.objectiveText,
      okr.ownerName,
      `${okr.latestCheckIn?.progress || 0}%`,
      `${okr.latestCheckIn?.confidence || 0} (${okr.latestCheckIn?.confidenceLabel || 'N/A'})`,
      okr.trend === 'up' ? '↑' : okr.trend === 'down' ? '↓' : '→'
    ]);
    
    return [headers.join('\t'), ...rows.map(r => r.join('\t'))].join('\n');
  };

  const generateConfidenceHistoryCSV = () => {
    const headers = ['Objective', 'Owner', 'Check-in Date', 'Progress', 'Confidence', 'Label', 'Delta', 'Reason for Change', 'Note'];

    const rows: string[][] = [];

    quarterOKRs.forEach(okr => {
      const okrCheckIns = checkIns
        .filter(ci => ci.okrId === okr.id)
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

      okrCheckIns.forEach((ci, index) => {
        const prevConfidence = index > 0 ? okrCheckIns[index - 1].confidence : null;
        const delta = prevConfidence !== null ? ci.confidence - prevConfidence : '';

        rows.push([
          `"${okr.objectiveText}"`,
          `"${okr.ownerName}"`,
          ci.date,
          String(ci.progress),
          String(ci.confidence),
          ci.confidenceLabel,
          String(delta),
          `"${ci.reasonForChange || ''}"`,
          `"${ci.optionalNote || ''}"`,
        ]);
      });

      if (okrCheckIns.length === 0) {
        rows.push([
          `"${okr.objectiveText}"`,
          `"${okr.ownerName}"`,
          'No check-ins',
          '0', '0', 'N/A', '', '', '',
        ]);
      }
    });

    return [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
  };

  const handleDownloadConfidenceHistory = () => {
    const csv = generateConfidenceHistoryCSV();
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `confidence-history-${currentQuarter}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast({
      title: "Downloaded",
      description: "Confidence history exported to CSV"
    });
  };

  const generateQuarterReview = () => {
    const withCheckIns = quarterOKRs.filter(o => o.checkIns.length >= 2);

    const earlyDrops: string[] = [];
    const recovered: string[] = [];
    const neverRecovered: string[] = [];
    const lateSurprises: string[] = [];
    const steadyHigh: string[] = [];
    const steadyLow: string[] = [];

    withCheckIns.forEach(okr => {
      const sorted = [...okr.checkIns].sort((a, b) =>
        new Date(a.date).getTime() - new Date(b.date).getTime()
      );

      const first = sorted[0];
      const last = sorted[sorted.length - 1];
      const mid = sorted[Math.floor(sorted.length / 2)];
      const lowest = sorted.reduce((min, ci) => ci.confidence < min.confidence ? ci : min, sorted[0]);

      const label = `${okr.objectiveText} (${okr.ownerName}): ${first.confidence} → ${last.confidence}`;
      const reason = last.reasonForChange ? ` — ${last.reasonForChange}` : '';

      if (last.confidence >= 75 && first.confidence >= 60) {
        steadyHigh.push(`• ${label}`);
      } else if (last.confidence < 40 && first.confidence < 50) {
        steadyLow.push(`• ${label}${reason}`);
      } else if (mid.confidence < first.confidence && last.confidence > mid.confidence) {
        recovered.push(`• ${label} (low: ${lowest.confidence})${reason}`);
      } else if (first.confidence >= 60 && last.confidence < 50) {
        if (sorted.indexOf(lowest) >= sorted.length - 2) {
          lateSurprises.push(`• ${label}${reason}`);
        } else {
          neverRecovered.push(`• ${label}${reason}`);
        }
      } else if (mid.confidence < first.confidence - 10) {
        earlyDrops.push(`• ${label}${reason}`);
      } else {
        if (last.confidence >= 60) {
          steadyHigh.push(`• ${label}`);
        } else {
          earlyDrops.push(`• ${label}${reason}`);
        }
      }
    });

    let review = `QUARTER-IN-REVIEW — ${formatQuarter(currentQuarter)}\n`;
    review += `What changed, when, and why.\n\n`;

    if (recovered.length > 0) {
      review += `RECOVERED\nOKRs that hit a rough patch but came back.\n${recovered.join('\n')}\n\n`;
    }
    if (lateSurprises.length > 0) {
      review += `LATE SURPRISES\nOKRs that were on track but dropped late.\n${lateSurprises.join('\n')}\n\n`;
    }
    if (neverRecovered.length > 0) {
      review += `DID NOT RECOVER\nOKRs that dropped and stayed down.\n${neverRecovered.join('\n')}\n\n`;
    }
    if (earlyDrops.length > 0) {
      review += `STRUGGLED EARLY\nOKRs with early confidence drops.\n${earlyDrops.join('\n')}\n\n`;
    }
    if (steadyLow.length > 0) {
      review += `PERSISTENTLY AT RISK\nOKRs that stayed in the danger zone.\n${steadyLow.join('\n')}\n\n`;
    }
    if (steadyHigh.length > 0) {
      review += `ON TRACK THROUGHOUT\nOKRs with stable, high confidence.\n${steadyHigh.join('\n')}\n\n`;
    }

    const noCheckIns = quarterOKRs.filter(o => o.checkIns.length < 2);
    if (noCheckIns.length > 0) {
      review += `INSUFFICIENT DATA\nOKRs with fewer than 2 check-ins — no trajectory available.\n`;
      review += noCheckIns.map(o => `• ${o.objectiveText} (${o.ownerName})`).join('\n');
      review += '\n';
    }

    return review.trim();
  };

  const handleCopyReview = async () => {
    await navigator.clipboard.writeText(generateQuarterReview());
    setCopiedReview(true);
    setTimeout(() => setCopiedReview(false), 2000);
    toast({
      title: "Copied",
      description: "Quarter-in-review narrative copied to clipboard"
    });
  };

  const generateSummary = () => {
    const totalOKRs = quarterOKRs.length;
    const atRisk = quarterOKRs.filter(o => (o.latestCheckIn?.confidence || 0) < 40).length;
    const onTrack = quarterOKRs.filter(o => (o.latestCheckIn?.confidence || 0) >= 40).length;
    
    const avgConfidence = quarterOKRs.length > 0
      ? Math.round(quarterOKRs.reduce((sum, o) => sum + (o.latestCheckIn?.confidence || 0), 0) / quarterOKRs.length)
      : 0;

    const atRiskOKRs = quarterOKRs
      .filter(o => (o.latestCheckIn?.confidence || 0) < 40)
      .map(o => `• ${o.objectiveText} (${o.ownerName}) – ${o.latestCheckIn?.confidence || 0}% confidence`)
      .join('\n');

    return `
EXECUTIVE SUMMARY – ${formatQuarter(currentQuarter)}

OVERVIEW
Total OKRs: ${totalOKRs}
On Track: ${onTrack} (${Math.round((onTrack / totalOKRs) * 100)}%)
At Risk: ${atRisk} (${Math.round((atRisk / totalOKRs) * 100)}%)
Average Confidence: ${avgConfidence}% (${getConfidenceLabel(avgConfidence)})

${atRisk > 0 ? `AT RISK OKRs
${atRiskOKRs}` : 'No OKRs at risk.'}

TOP OKRs BY LEVEL
Product Area:
${quarterOKRs.filter(o => o.level === 'productArea').map(o => `• ${o.objectiveText} – ${o.latestCheckIn?.confidence || 0}% confidence`).join('\n') || 'None'}

Domain:
${quarterOKRs.filter(o => o.level === 'domain').map(o => `• ${o.objectiveText} – ${o.latestCheckIn?.confidence || 0}% confidence`).join('\n') || 'None'}
`.trim();
  };

  const handleDownloadCSV = () => {
    const csv = generateCSV();
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `okrs-${currentQuarter}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast({
      title: "Downloaded",
      description: "OKR data exported to CSV"
    });
  };

  const handleCopyTable = async () => {
    await navigator.clipboard.writeText(generateTable());
    setCopiedTable(true);
    setTimeout(() => setCopiedTable(false), 2000);
    
    toast({
      title: "Copied",
      description: "Table copied – paste into Excel or Sheets"
    });
  };

  const handleCopySummary = async () => {
    await navigator.clipboard.writeText(generateSummary());
    setCopiedSummary(true);
    setTimeout(() => setCopiedSummary(false), 2000);
    
    toast({
      title: "Copied",
      description: "Executive summary copied to clipboard"
    });
  };

  const handleGenerateQBRPresentation = async () => {
    setIsGeneratingPptx(true);
    
    try {
      const scope = productAreas[0]?.name || 'Product';
      
      generateQBRPresentation({
        quarter: currentQuarter,
        scope,
        okrs: quarterOKRs,
        checkIns: checkIns.filter(ci => 
          quarterOKRs.some(o => o.id === ci.okrId)
        ),
      });
      
      toast({
        title: "Generated",
        description: "QBR presentation downloaded"
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to generate presentation",
        variant: "destructive"
      });
    } finally {
      setIsGeneratingPptx(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="page-title">Exports</h1>
        <p className="helper-text mt-1">
          Export OKR data for presentations and reports · {formatQuarter(currentQuarter)}
        </p>
      </div>

      {/* Executive Review Deck - Featured */}
      <Card className="border-border/60 bg-gradient-to-br from-card to-muted/20">
        <CardHeader className="pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-base font-medium">Executive Review Deck</CardTitle>
              <CardDescription className="text-xs">Board-ready snapshot from current confidence and trends</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4 pt-0">
          <p className="text-sm text-muted-foreground">
            Generate a complete PowerPoint presentation with executive summary, OKR outcomes, 
            confidence trends, at-risk analysis, prioritization decisions, and next quarter bets.
            Ready for senior leadership with no additional editing required.
          </p>
          
          <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
            <span className="px-2 py-1 bg-muted rounded">7 slides</span>
            <span className="px-2 py-1 bg-muted rounded">Board-ready format</span>
            <span className="px-2 py-1 bg-muted rounded">Confidence visualization</span>
            <span className="px-2 py-1 bg-muted rounded">Trend analysis</span>
          </div>
          
          <Button 
            onClick={handleGenerateQBRPresentation} 
            disabled={isGeneratingPptx}
            className="gap-2"
          >
            <Presentation className="w-4 h-4" />
            {isGeneratingPptx ? 'Generating...' : 'Download Executive Deck'}
          </Button>
        </CardContent>
      </Card>

      {/* Quarter-in-Review - Featured */}
      <Card className="border-border/60 bg-gradient-to-br from-card to-muted/20">
        <CardHeader className="pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <BookOpen className="w-5 h-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-base font-medium">Quarter-in-Review</CardTitle>
              <CardDescription className="text-xs">Narrative analysis of what changed, when, and why</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4 pt-0">
          <p className="text-sm text-muted-foreground">
            Retrospective intelligence organized by story arc: OKRs that recovered, 
            late surprises, persistent risks, and steady performers. 
            Built for learning, not just reporting.
          </p>
          <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
            <span className="px-2 py-1 bg-muted rounded">Recovery patterns</span>
            <span className="px-2 py-1 bg-muted rounded">Late surprises</span>
            <span className="px-2 py-1 bg-muted rounded">Persistent risks</span>
            <span className="px-2 py-1 bg-muted rounded">Reasons for change</span>
          </div>
          <Button variant="ghost" size="sm" onClick={handleCopyReview} className="gap-2">
            {copiedReview ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
            {copiedReview ? 'Copied' : 'Copy Narrative'}
          </Button>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Excel Export */}
        <Card className="border-border/60">
          <CardHeader className="pb-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-muted flex items-center justify-center">
                <FileSpreadsheet className="w-4 h-4 text-foreground" />
              </div>
              <div>
                <CardTitle className="text-base font-medium">Excel / Sheets</CardTitle>
                <CardDescription className="text-xs">Export OKR table data</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4 pt-0">
            <p className="text-sm text-muted-foreground">
              Export all OKRs with progress, confidence, labels, and trends. 
              Compatible with Excel, Google Sheets, and other spreadsheet applications.
            </p>
            
            <div className="flex gap-2">
              <Button onClick={handleDownloadCSV} size="sm" variant="outline" className="gap-2">
                <Download className="w-3.5 h-3.5" />
                Download CSV
              </Button>
              <Button variant="ghost" size="sm" onClick={handleCopyTable} className="gap-2">
                {copiedTable ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                {copiedTable ? 'Copied' : 'Copy Table'}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Text Summary Export */}
        <Card className="border-border/60">
          <CardHeader className="pb-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-muted flex items-center justify-center">
                <Presentation className="w-4 h-4 text-foreground" />
              </div>
              <div>
                <CardTitle className="text-base font-medium">Text Summary</CardTitle>
                <CardDescription className="text-xs">Plain text executive summary</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4 pt-0">
            <p className="text-sm text-muted-foreground">
              Generate a formatted text summary with key signals and at-risk OKRs. 
              Copy and paste into emails or documents.
            </p>
            
            <Button variant="ghost" size="sm" onClick={handleCopySummary} className="gap-2">
              {copiedSummary ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              {copiedSummary ? 'Copied' : 'Copy Summary'}
            </Button>
          </CardContent>
        </Card>

        {/* Confidence History CSV */}
        <Card className="border-border/60">
          <CardHeader className="pb-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-muted flex items-center justify-center">
                <TrendingUp className="w-4 h-4 text-foreground" />
              </div>
              <div>
                <CardTitle className="text-base font-medium">Confidence History</CardTitle>
                <CardDescription className="text-xs">Time-series confidence data per OKR</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4 pt-0">
            <p className="text-sm text-muted-foreground">
              Every check-in for every OKR: confidence scores, deltas between check-ins, 
              and reasons for change. Built for retrospective analysis.
            </p>
            <Button onClick={handleDownloadConfidenceHistory} size="sm" variant="outline" className="gap-2">
              <Download className="w-3.5 h-3.5" />
              Download CSV
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Preview */}
      <Card className="border-border/60">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-medium">Preview: Quarter-in-Review</CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <pre className="bg-muted/50 p-4 rounded-lg text-xs font-mono whitespace-pre-wrap overflow-x-auto text-muted-foreground">
            {generateQuarterReview()}
          </pre>
        </CardContent>
      </Card>
    </div>
  );
}
