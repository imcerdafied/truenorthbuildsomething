import { useMemo, useState } from 'react';
import { useApp } from '@/context/AppContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { formatQuarter, getConfidenceLabel } from '@/types';
import { FileSpreadsheet, Presentation, Download, Copy, Check, Sparkles } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { generateQBRPresentation } from '@/lib/qbrExport';

export function ExportsPage() {
  const { toast } = useToast();
  const { currentQuarter, getOKRsByQuarter, checkIns, productAreas } = useApp();
  
  const [copiedTable, setCopiedTable] = useState(false);
  const [copiedSummary, setCopiedSummary] = useState(false);
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

      {/* QBR Presentation - Featured */}
      <Card className="border-border/60 bg-gradient-to-br from-card to-muted/20">
        <CardHeader className="pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-base font-medium">QBR Presentation</CardTitle>
              <CardDescription className="text-xs">Executive-grade quarterly review slides</CardDescription>
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
            {isGeneratingPptx ? 'Generating...' : 'Download QBR Presentation'}
          </Button>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
      </div>

      {/* Preview */}
      <Card className="border-border/60">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-medium">Preview: Text Summary</CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <pre className="bg-muted/50 p-4 rounded-lg text-xs font-mono whitespace-pre-wrap overflow-x-auto text-muted-foreground">
            {generateSummary()}
          </pre>
        </CardContent>
      </Card>
    </div>
  );
}
