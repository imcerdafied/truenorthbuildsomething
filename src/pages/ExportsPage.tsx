import { useMemo } from 'react';
import { useApp } from '@/context/AppContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { formatQuarter, getConfidenceLabel } from '@/types';
import { FileSpreadsheet, Presentation, Download, Copy, Check } from 'lucide-react';
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';

export function ExportsPage() {
  const { toast } = useToast();
  const { currentQuarter, getOKRsByQuarter, checkIns, teams, domains, productAreas } = useApp();
  
  const [copiedTable, setCopiedTable] = useState(false);
  const [copiedSummary, setCopiedSummary] = useState(false);

  const quarterOKRs = useMemo(() => {
    return getOKRsByQuarter(currentQuarter);
  }, [currentQuarter, getOKRsByQuarter]);

  // Generate CSV content
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

  // Generate table for copy/paste
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

  // Generate executive summary
  const generateSummary = () => {
    const totalOKRs = quarterOKRs.length;
    const atRisk = quarterOKRs.filter(o => (o.latestCheckIn?.confidence || 0) < 40).length;
    const onTrack = quarterOKRs.filter(o => (o.latestCheckIn?.confidence || 0) >= 40).length;
    
    const avgConfidence = quarterOKRs.length > 0
      ? Math.round(quarterOKRs.reduce((sum, o) => sum + (o.latestCheckIn?.confidence || 0), 0) / quarterOKRs.length)
      : 0;

    const atRiskOKRs = quarterOKRs
      .filter(o => (o.latestCheckIn?.confidence || 0) < 40)
      .map(o => `• ${o.objectiveText} (${o.ownerName}) - ${o.latestCheckIn?.confidence || 0}% confidence`)
      .join('\n');

    return `
EXECUTIVE SUMMARY - ${formatQuarter(currentQuarter)}

OVERVIEW
────────────────────────────────
Total OKRs: ${totalOKRs}
On Track: ${onTrack} (${Math.round((onTrack / totalOKRs) * 100)}%)
At Risk: ${atRisk} (${Math.round((atRisk / totalOKRs) * 100)}%)
Average Confidence: ${avgConfidence}% (${getConfidenceLabel(avgConfidence)})

${atRisk > 0 ? `AT RISK OKRs
────────────────────────────────
${atRiskOKRs}` : 'No OKRs at risk.'}

TOP OKRs BY LEVEL
────────────────────────────────
Product Area:
${quarterOKRs.filter(o => o.level === 'productArea').map(o => `• ${o.objectiveText} - ${o.latestCheckIn?.confidence || 0}% confidence`).join('\n') || 'None'}

Domain:
${quarterOKRs.filter(o => o.level === 'domain').map(o => `• ${o.objectiveText} - ${o.latestCheckIn?.confidence || 0}% confidence`).join('\n') || 'None'}
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
      description: "Table copied to clipboard - paste into Excel or Sheets"
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

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Exports</h1>
        <p className="helper-text mt-1">
          Export OKR data for presentations and reports · {formatQuarter(currentQuarter)}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Excel Export */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-confidence-high-bg flex items-center justify-center">
                <FileSpreadsheet className="w-5 h-5 text-confidence-high" />
              </div>
              <div>
                <CardTitle className="text-lg">Excel / Sheets</CardTitle>
                <CardDescription>Export OKR table data</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Export all OKRs with progress, confidence, labels, and trends. 
              Compatible with Excel, Google Sheets, and other spreadsheet applications.
            </p>
            
            <div className="flex gap-2">
              <Button onClick={handleDownloadCSV} className="gap-2">
                <Download className="w-4 h-4" />
                Download CSV
              </Button>
              <Button variant="outline" onClick={handleCopyTable} className="gap-2">
                {copiedTable ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                {copiedTable ? 'Copied!' : 'Copy Table'}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* PowerPoint Export */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-confidence-medium-bg flex items-center justify-center">
                <Presentation className="w-5 h-5 text-confidence-medium" />
              </div>
              <div>
                <CardTitle className="text-lg">PowerPoint</CardTitle>
                <CardDescription>Executive summary for presentations</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Generate a formatted executive summary with key signals, at-risk OKRs, 
              and confidence metrics. Copy and paste into your slides.
            </p>
            
            <Button variant="outline" onClick={handleCopySummary} className="gap-2">
              {copiedSummary ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              {copiedSummary ? 'Copied!' : 'Copy Summary'}
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Preview */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Preview: Executive Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <pre className="bg-muted p-4 rounded-lg text-sm font-mono whitespace-pre-wrap overflow-x-auto">
            {generateSummary()}
          </pre>
        </CardContent>
      </Card>
    </div>
  );
}
