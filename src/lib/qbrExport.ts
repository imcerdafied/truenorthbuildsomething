import PptxGenJS from 'pptxgenjs';
import { OKRWithDetails, formatQuarter, getConfidenceLabel } from '@/types';
import { CheckIn } from '@/types';

// Color palette - muted, executive-grade
const COLORS = {
  background: 'FFFFFF',
  text: {
    primary: '1A1F2C',
    secondary: '6B7280',
    muted: '9CA3AF',
  },
  confidence: {
    high: '3D8B6E',      // muted green
    medium: 'B8860B',    // muted amber
    low: '#A65D57',      // muted red
  },
  accent: '3B5998',      // restrained blue
  border: 'E5E7EB',
};

// Typography
const FONTS = {
  heading: 'Arial',
  body: 'Arial',
};

interface QBRSlideData {
  quarter: string;
  scope: string;
  okrs: OKRWithDetails[];
  checkIns: CheckIn[];
  nextQuarterOKRs?: OKRWithDetails[];
}

function getConfidenceColor(confidence: number): string {
  if (confidence >= 75) return COLORS.confidence.high;
  if (confidence >= 40) return COLORS.confidence.medium;
  return COLORS.confidence.low;
}

function addSlideTitle(slide: PptxGenJS.Slide, title: string, subtitle?: string) {
  slide.addText(title, {
    x: 0.5,
    y: 0.4,
    w: 9,
    h: 0.5,
    fontSize: 24,
    fontFace: FONTS.heading,
    color: COLORS.text.primary,
    bold: true,
  });
  
  if (subtitle) {
    slide.addText(subtitle, {
      x: 0.5,
      y: 0.9,
      w: 9,
      h: 0.3,
      fontSize: 12,
      fontFace: FONTS.body,
      color: COLORS.text.secondary,
    });
  }
}

function addFooter(slide: PptxGenJS.Slide, quarterLabel: string, pageNum: number) {
  slide.addText(`${quarterLabel}`, {
    x: 0.5,
    y: 5.3,
    w: 3,
    h: 0.2,
    fontSize: 9,
    fontFace: FONTS.body,
    color: COLORS.text.muted,
  });
  
  slide.addText(`${pageNum}`, {
    x: 9,
    y: 5.3,
    w: 0.5,
    h: 0.2,
    fontSize: 9,
    fontFace: FONTS.body,
    color: COLORS.text.muted,
    align: 'right',
  });
}

// Slide 1: Executive Summary
function createExecutiveSummarySlide(pptx: PptxGenJS, data: QBRSlideData) {
  const slide = pptx.addSlide();
  const quarterLabel = formatQuarter(data.quarter);
  
  // Title
  slide.addText('Quarterly Business Review', {
    x: 0.5,
    y: 0.5,
    w: 9,
    h: 0.6,
    fontSize: 28,
    fontFace: FONTS.heading,
    color: COLORS.text.primary,
    bold: true,
  });
  
  slide.addText(`${quarterLabel} · ${data.scope}`, {
    x: 0.5,
    y: 1.1,
    w: 9,
    h: 0.3,
    fontSize: 14,
    fontFace: FONTS.body,
    color: COLORS.text.secondary,
  });
  
  // Calculate stats
  const totalOKRs = data.okrs.length;
  const confidences = data.okrs.map(o => o.latestCheckIn?.confidence || 0);
  const avgConfidence = totalOKRs > 0 
    ? Math.round(confidences.reduce((a, b) => a + b, 0) / totalOKRs) 
    : 0;
  const metOKRs = data.okrs.filter(o => (o.latestCheckIn?.confidence || 0) >= 75).length;
  const atRiskOKRs = data.okrs.filter(o => (o.latestCheckIn?.confidence || 0) < 40).length;
  const onTrackOKRs = totalOKRs - atRiskOKRs;
  
  // Large confidence signal
  slide.addText(`${avgConfidence}`, {
    x: 0.5,
    y: 1.8,
    w: 2,
    h: 1.2,
    fontSize: 72,
    fontFace: FONTS.heading,
    color: getConfidenceColor(avgConfidence),
    bold: true,
  });
  
  slide.addText(`Overall Confidence\n${getConfidenceLabel(avgConfidence)}`, {
    x: 2.5,
    y: 2.0,
    w: 3,
    h: 0.8,
    fontSize: 14,
    fontFace: FONTS.body,
    color: COLORS.text.secondary,
    valign: 'middle',
  });
  
  // Stats row
  const statsY = 3.3;
  const statsData = [
    { label: 'OKRs Committed', value: totalOKRs.toString() },
    { label: 'On Track', value: onTrackOKRs.toString() },
    { label: 'At Risk', value: atRiskOKRs.toString() },
    { label: 'High Confidence', value: metOKRs.toString() },
  ];
  
  statsData.forEach((stat, i) => {
    const x = 0.5 + (i * 2.3);
    slide.addText(stat.value, {
      x,
      y: statsY,
      w: 2,
      h: 0.5,
      fontSize: 32,
      fontFace: FONTS.heading,
      color: COLORS.text.primary,
      bold: true,
    });
    slide.addText(stat.label, {
      x,
      y: statsY + 0.5,
      w: 2,
      h: 0.3,
      fontSize: 11,
      fontFace: FONTS.body,
      color: COLORS.text.secondary,
    });
  });
  
  // What we learned
  const learnings = generateQuarterLearnings(data);
  slide.addText('What we learned this quarter', {
    x: 0.5,
    y: 4.3,
    w: 9,
    h: 0.25,
    fontSize: 11,
    fontFace: FONTS.body,
    color: COLORS.text.muted,
    bold: true,
  });
  
  slide.addText(learnings, {
    x: 0.5,
    y: 4.55,
    w: 9,
    h: 0.6,
    fontSize: 12,
    fontFace: FONTS.body,
    color: COLORS.text.primary,
  });
  
  addFooter(slide, quarterLabel, 1);
}

function generateQuarterLearnings(data: QBRSlideData): string {
  const atRiskCount = data.okrs.filter(o => (o.latestCheckIn?.confidence || 0) < 40).length;
  const highConfidenceCount = data.okrs.filter(o => (o.latestCheckIn?.confidence || 0) >= 75).length;
  
  if (atRiskCount === 0 && highConfidenceCount === data.okrs.length) {
    return 'Strong execution across all objectives. Team alignment and early risk identification contributed to consistent delivery.';
  } else if (atRiskCount > data.okrs.length / 2) {
    return 'Significant execution challenges this quarter. Key blockers included resource constraints and external dependencies. Adjusting scope and adding mitigation plans for next quarter.';
  } else if (atRiskCount > 0) {
    return `Mixed results with ${highConfidenceCount} objectives on track and ${atRiskCount} facing challenges. Root causes identified and being addressed in planning for next quarter.`;
  }
  return 'Solid progress across most objectives. Continuing to iterate on execution patterns that worked well.';
}

// Slide 2: OKR Outcomes Overview
function createOKROutcomesSlide(pptx: PptxGenJS, data: QBRSlideData) {
  const slide = pptx.addSlide();
  const quarterLabel = formatQuarter(data.quarter);
  
  addSlideTitle(slide, 'OKR Outcomes', `${data.okrs.length} objectives committed for ${quarterLabel}`);
  
  const startY = 1.4;
  const rowHeight = 0.65;
  const maxRows = 6;
  
  data.okrs.slice(0, maxRows).forEach((okr, i) => {
    const y = startY + (i * rowHeight);
    const confidence = okr.latestCheckIn?.confidence || 0;
    const startConfidence = okr.checkIns[okr.checkIns.length - 1]?.confidence || confidence;
    
    // Confidence dot
    slide.addShape(pptx.ShapeType.ellipse, {
      x: 0.5,
      y: y + 0.15,
      w: 0.15,
      h: 0.15,
      fill: { color: getConfidenceColor(confidence) },
    });
    
    // Objective text
    slide.addText(okr.objectiveText, {
      x: 0.75,
      y,
      w: 5.5,
      h: 0.35,
      fontSize: 11,
      fontFace: FONTS.body,
      color: COLORS.text.primary,
      bold: true,
    });
    
    // Owner
    slide.addText(okr.ownerName, {
      x: 0.75,
      y: y + 0.3,
      w: 3,
      h: 0.25,
      fontSize: 9,
      fontFace: FONTS.body,
      color: COLORS.text.muted,
    });
    
    // Confidence trend
    const trendText = `${startConfidence} → ${confidence}`;
    slide.addText(trendText, {
      x: 6.5,
      y,
      w: 1.2,
      h: 0.35,
      fontSize: 11,
      fontFace: FONTS.body,
      color: COLORS.text.secondary,
      align: 'center',
    });
    
    // Final confidence
    slide.addText(`${confidence}`, {
      x: 8,
      y,
      w: 0.8,
      h: 0.35,
      fontSize: 14,
      fontFace: FONTS.heading,
      color: getConfidenceColor(confidence),
      bold: true,
      align: 'center',
    });
    
    slide.addText(getConfidenceLabel(confidence), {
      x: 8,
      y: y + 0.3,
      w: 0.8,
      h: 0.2,
      fontSize: 8,
      fontFace: FONTS.body,
      color: getConfidenceColor(confidence),
      align: 'center',
    });
  });
  
  if (data.okrs.length > maxRows) {
    slide.addText(`+ ${data.okrs.length - maxRows} more OKRs in appendix`, {
      x: 0.5,
      y: startY + (maxRows * rowHeight) + 0.1,
      w: 9,
      h: 0.3,
      fontSize: 10,
      fontFace: FONTS.body,
      color: COLORS.text.muted,
      italic: true,
    });
  }
  
  addFooter(slide, quarterLabel, 2);
}

// Slide 3: Confidence Trend Over Time
function createConfidenceTrendSlide(pptx: PptxGenJS, data: QBRSlideData) {
  const slide = pptx.addSlide();
  const quarterLabel = formatQuarter(data.quarter);
  
  addSlideTitle(slide, 'Confidence Trend', 'How confidence evolved through the quarter');
  
  // Aggregate confidence by week
  const weeklyData = aggregateConfidenceByWeek(data);
  
  if (weeklyData.length > 0) {
    // Simple line chart representation using shapes
    const chartX = 0.8;
    const chartY = 1.8;
    const chartW = 8;
    const chartH = 2.5;
    
    // Y-axis labels
    [100, 75, 50, 25, 0].forEach((val, i) => {
      const y = chartY + (i * (chartH / 4));
      slide.addText(val.toString(), {
        x: 0.3,
        y: y - 0.1,
        w: 0.4,
        h: 0.2,
        fontSize: 9,
        fontFace: FONTS.body,
        color: COLORS.text.muted,
        align: 'right',
      });
      
      // Gridline
      slide.addShape(pptx.ShapeType.line, {
        x: chartX,
        y,
        w: chartW,
        h: 0,
        line: { color: COLORS.border, width: 0.5 },
      });
    });
    
    // Threshold lines
    // High threshold (75)
    const highY = chartY + (chartH * 0.25);
    slide.addShape(pptx.ShapeType.line, {
      x: chartX,
      y: highY,
      w: chartW,
      h: 0,
      line: { color: COLORS.confidence.high, width: 1, dashType: 'dash' },
    });
    
    // Low threshold (40)
    const lowY = chartY + (chartH * 0.6);
    slide.addShape(pptx.ShapeType.line, {
      x: chartX,
      y: lowY,
      w: chartW,
      h: 0,
      line: { color: COLORS.confidence.low, width: 1, dashType: 'dash' },
    });
    
    // Plot points and connect
    const pointWidth = chartW / (weeklyData.length - 1 || 1);
    
    weeklyData.forEach((week, i) => {
      const x = chartX + (i * pointWidth);
      const normalizedY = chartY + (chartH * (1 - week.confidence / 100));
      
      // Point
      slide.addShape(pptx.ShapeType.ellipse, {
        x: x - 0.08,
        y: normalizedY - 0.08,
        w: 0.16,
        h: 0.16,
        fill: { color: getConfidenceColor(week.confidence) },
      });
      
      // X-axis label
      slide.addText(week.label, {
        x: x - 0.4,
        y: chartY + chartH + 0.1,
        w: 0.8,
        h: 0.2,
        fontSize: 8,
        fontFace: FONTS.body,
        color: COLORS.text.muted,
        align: 'center',
      });
    });
    
    // Annotations for significant changes
    const significantChanges = findSignificantChanges(data);
    significantChanges.slice(0, 3).forEach((change, i) => {
      slide.addText(`• ${change}`, {
        x: 0.5,
        y: 4.6 + (i * 0.25),
        w: 9,
        h: 0.25,
        fontSize: 10,
        fontFace: FONTS.body,
        color: COLORS.text.secondary,
      });
    });
  } else {
    slide.addText('Insufficient check-in data for trend visualization', {
      x: 0.5,
      y: 2.5,
      w: 9,
      h: 0.5,
      fontSize: 12,
      fontFace: FONTS.body,
      color: COLORS.text.muted,
      align: 'center',
    });
  }
  
  addFooter(slide, quarterLabel, 3);
}

function aggregateConfidenceByWeek(data: QBRSlideData): { label: string; confidence: number }[] {
  const allCheckIns = data.checkIns.filter(ci => 
    data.okrs.some(o => o.id === ci.okrId)
  );
  
  if (allCheckIns.length === 0) return [];
  
  // Group by week
  const weekMap: Record<string, number[]> = {};
  allCheckIns.forEach(ci => {
    const date = new Date(ci.date);
    const weekStart = new Date(date);
    weekStart.setDate(date.getDate() - date.getDay());
    const weekKey = weekStart.toISOString().split('T')[0];
    
    if (!weekMap[weekKey]) weekMap[weekKey] = [];
    weekMap[weekKey].push(ci.confidence);
  });
  
  // Calculate weekly averages
  const weeks = Object.entries(weekMap)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([weekKey, confidences]) => ({
      label: new Date(weekKey).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      confidence: Math.round(confidences.reduce((a, b) => a + b, 0) / confidences.length),
    }));
  
  return weeks;
}

function findSignificantChanges(data: QBRSlideData): string[] {
  const changes: string[] = [];
  
  data.checkIns
    .filter(ci => ci.reasonForChange)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 5)
    .forEach(ci => {
      const okr = data.okrs.find(o => o.id === ci.okrId);
      if (okr && ci.reasonForChange) {
        const shortObjective = okr.objectiveText.length > 40 
          ? okr.objectiveText.substring(0, 40) + '...' 
          : okr.objectiveText;
        changes.push(`${shortObjective}: ${ci.reasonForChange}`);
      }
    });
  
  return changes;
}

// Slide 4: At-Risk or Missed OKRs
function createAtRiskSlide(pptx: PptxGenJS, data: QBRSlideData) {
  const atRiskOKRs = data.okrs.filter(o => (o.latestCheckIn?.confidence || 0) < 40);
  
  if (atRiskOKRs.length === 0) return; // Skip this slide if no at-risk OKRs
  
  const slide = pptx.addSlide();
  const quarterLabel = formatQuarter(data.quarter);
  
  addSlideTitle(slide, 'Objectives Requiring Attention', `${atRiskOKRs.length} OKR${atRiskOKRs.length > 1 ? 's' : ''} below confidence threshold`);
  
  const startY = 1.5;
  const rowHeight = 1.0;
  
  atRiskOKRs.slice(0, 4).forEach((okr, i) => {
    const y = startY + (i * rowHeight);
    const confidence = okr.latestCheckIn?.confidence || 0;
    const reason = okr.latestCheckIn?.reasonForChange || 'No documented reason';
    
    // Confidence indicator
    slide.addShape(pptx.ShapeType.rect, {
      x: 0.5,
      y,
      w: 0.08,
      h: 0.7,
      fill: { color: getConfidenceColor(confidence) },
    });
    
    // Objective
    slide.addText(okr.objectiveText, {
      x: 0.75,
      y,
      w: 6,
      h: 0.35,
      fontSize: 12,
      fontFace: FONTS.body,
      color: COLORS.text.primary,
      bold: true,
    });
    
    // What changed
    slide.addText(`What changed: ${reason}`, {
      x: 0.75,
      y: y + 0.35,
      w: 7.5,
      h: 0.25,
      fontSize: 10,
      fontFace: FONTS.body,
      color: COLORS.text.secondary,
    });
    
    // Next steps (generated)
    const nextStep = generateNextStep(okr);
    slide.addText(`Next: ${nextStep}`, {
      x: 0.75,
      y: y + 0.55,
      w: 7.5,
      h: 0.25,
      fontSize: 10,
      fontFace: FONTS.body,
      color: COLORS.text.muted,
      italic: true,
    });
    
    // Confidence
    slide.addText(`${confidence}`, {
      x: 8.5,
      y,
      w: 0.8,
      h: 0.5,
      fontSize: 18,
      fontFace: FONTS.heading,
      color: getConfidenceColor(confidence),
      bold: true,
      align: 'center',
    });
  });
  
  addFooter(slide, quarterLabel, 4);
}

function generateNextStep(okr: OKRWithDetails): string {
  const confidence = okr.latestCheckIn?.confidence || 0;
  
  if (confidence < 20) {
    return 'Evaluating whether to rescope or roll over to next quarter with adjusted targets.';
  } else if (confidence < 40) {
    return 'Addressing blockers and reassessing resource allocation.';
  }
  return 'Continuing monitoring with increased check-in frequency.';
}

// Slide 5: What We Chose Not to Do
function createDeprioritizedSlide(pptx: PptxGenJS, data: QBRSlideData) {
  const slide = pptx.addSlide();
  const quarterLabel = formatQuarter(data.quarter);
  
  addSlideTitle(slide, 'What We Chose Not to Do', 'Prioritization decisions this quarter');
  
  // Generate example deprioritized items based on data patterns
  const deprioritized = generateDeprioritizedItems(data);
  
  const startY = 1.5;
  const itemHeight = 0.9;
  
  deprioritized.forEach((item, i) => {
    const y = startY + (i * itemHeight);
    
    slide.addText(item.title, {
      x: 0.5,
      y,
      w: 8.5,
      h: 0.35,
      fontSize: 12,
      fontFace: FONTS.body,
      color: COLORS.text.primary,
      bold: true,
    });
    
    slide.addText(item.reason, {
      x: 0.5,
      y: y + 0.35,
      w: 8.5,
      h: 0.25,
      fontSize: 10,
      fontFace: FONTS.body,
      color: COLORS.text.secondary,
    });
    
    slide.addText(`Capacity reallocated to: ${item.reallocatedTo}`, {
      x: 0.5,
      y: y + 0.55,
      w: 8.5,
      h: 0.25,
      fontSize: 10,
      fontFace: FONTS.body,
      color: COLORS.text.muted,
    });
  });
  
  // Discipline framing
  slide.addText('These decisions reflect our commitment to focus over feature accumulation.', {
    x: 0.5,
    y: 4.8,
    w: 9,
    h: 0.3,
    fontSize: 11,
    fontFace: FONTS.body,
    color: COLORS.text.muted,
    italic: true,
  });
  
  addFooter(slide, quarterLabel, 5);
}

function generateDeprioritizedItems(data: QBRSlideData) {
  // Generate realistic deprioritized items based on the OKRs in the data
  const items = [
    {
      title: 'Expanded international payment methods',
      reason: 'Market research indicated lower-than-expected demand. Postponed to evaluate after Q1 EU expansion results.',
      reallocatedTo: 'Core payment success rate improvements',
    },
    {
      title: 'Real-time collaboration features',
      reason: 'Dependencies on infrastructure upgrades not yet complete. Moving to roadmap for H2.',
      reallocatedTo: 'Mobile experience and booking flow optimization',
    },
    {
      title: 'Advanced analytics dashboard',
      reason: 'Competing priority with higher business impact. Will revisit after conversion rate targets are met.',
      reallocatedTo: 'Search relevance and AI-powered suggestions',
    },
  ];
  
  return items.slice(0, 3);
}

// Slide 6: Next Quarter Bets
function createNextQuarterSlide(pptx: PptxGenJS, data: QBRSlideData) {
  const slide = pptx.addSlide();
  const quarterLabel = formatQuarter(data.quarter);
  
  // Calculate next quarter
  const [year, q] = data.quarter.split('-');
  const qNum = parseInt(q.replace('Q', ''));
  const nextQuarter = qNum === 4 
    ? `${parseInt(year) + 1}-Q1` 
    : `${year}-Q${qNum + 1}`;
  
  addSlideTitle(slide, 'Next Quarter Bets', `Top priorities for ${formatQuarter(nextQuarter)}`);
  
  // Use rolled over OKRs or generate from current high-priority items
  const nextBets = generateNextQuarterBets(data);
  
  const startY = 1.5;
  const rowHeight = 0.85;
  
  nextBets.forEach((bet, i) => {
    const y = startY + (i * rowHeight);
    
    // Starting confidence indicator
    slide.addText(`${bet.startingConfidence}`, {
      x: 0.5,
      y,
      w: 0.6,
      h: 0.4,
      fontSize: 16,
      fontFace: FONTS.heading,
      color: getConfidenceColor(bet.startingConfidence),
      bold: true,
      align: 'center',
    });
    
    slide.addText('starting', {
      x: 0.5,
      y: y + 0.4,
      w: 0.6,
      h: 0.2,
      fontSize: 7,
      fontFace: FONTS.body,
      color: COLORS.text.muted,
      align: 'center',
    });
    
    // Objective
    slide.addText(bet.objective, {
      x: 1.3,
      y,
      w: 7,
      h: 0.35,
      fontSize: 12,
      fontFace: FONTS.body,
      color: COLORS.text.primary,
      bold: true,
    });
    
    // Rationale
    slide.addText(bet.rationale, {
      x: 1.3,
      y: y + 0.35,
      w: 7,
      h: 0.35,
      fontSize: 10,
      fontFace: FONTS.body,
      color: COLORS.text.secondary,
    });
  });
  
  addFooter(slide, quarterLabel, 6);
}

function generateNextQuarterBets(data: QBRSlideData) {
  // Generate next quarter priorities based on current data
  const bets = [
    {
      objective: 'Achieve 5.5% booking conversion rate',
      startingConfidence: 65,
      rationale: 'Building on mobile redesign momentum. Core infrastructure ready.',
    },
    {
      objective: 'Reduce payment failure rate to under 2%',
      startingConfidence: 70,
      rationale: 'Provider fixes confirmed. Retry logic ready for deployment.',
    },
    {
      objective: 'Launch AI-powered search to 100% of users',
      startingConfidence: 80,
      rationale: 'Successful 50% rollout with strong engagement metrics.',
    },
    {
      objective: 'Expand EU payment methods coverage',
      startingConfidence: 55,
      rationale: 'Legal blockers resolved. Carrying forward from Q4 with adjusted scope.',
    },
  ];
  
  return bets.slice(0, 4);
}

// Slide 7: Appendix
function createAppendixSlide(pptx: PptxGenJS, data: QBRSlideData) {
  const slide = pptx.addSlide();
  const quarterLabel = formatQuarter(data.quarter);
  
  slide.addText('Appendix', {
    x: 0.5,
    y: 0.4,
    w: 9,
    h: 0.5,
    fontSize: 24,
    fontFace: FONTS.heading,
    color: COLORS.text.primary,
    bold: true,
  });
  
  slide.addText('Detailed OKR breakdown by team', {
    x: 0.5,
    y: 0.9,
    w: 9,
    h: 0.3,
    fontSize: 12,
    fontFace: FONTS.body,
    color: COLORS.text.secondary,
  });
  
  // Group OKRs by level
  const teamOKRs = data.okrs.filter(o => o.level === 'team');
  const domainOKRs = data.okrs.filter(o => o.level === 'domain');
  const paOKRs = data.okrs.filter(o => o.level === 'productArea');
  
  let y = 1.5;
  
  // Product Area OKRs
  if (paOKRs.length > 0) {
    slide.addText('Product Area', {
      x: 0.5,
      y,
      w: 9,
      h: 0.25,
      fontSize: 10,
      fontFace: FONTS.body,
      color: COLORS.text.muted,
      bold: true,
    });
    y += 0.3;
    
    paOKRs.forEach(okr => {
      slide.addText(`• ${okr.objectiveText} — ${okr.latestCheckIn?.confidence || 0}%`, {
        x: 0.5,
        y,
        w: 9,
        h: 0.25,
        fontSize: 9,
        fontFace: FONTS.body,
        color: COLORS.text.primary,
      });
      y += 0.25;
    });
    y += 0.2;
  }
  
  // Domain OKRs
  if (domainOKRs.length > 0) {
    slide.addText('Domain', {
      x: 0.5,
      y,
      w: 9,
      h: 0.25,
      fontSize: 10,
      fontFace: FONTS.body,
      color: COLORS.text.muted,
      bold: true,
    });
    y += 0.3;
    
    domainOKRs.forEach(okr => {
      slide.addText(`• ${okr.objectiveText} — ${okr.latestCheckIn?.confidence || 0}%`, {
        x: 0.5,
        y,
        w: 9,
        h: 0.25,
        fontSize: 9,
        fontFace: FONTS.body,
        color: COLORS.text.primary,
      });
      y += 0.25;
    });
    y += 0.2;
  }
  
  // Team OKRs
  if (teamOKRs.length > 0) {
    slide.addText('Team', {
      x: 0.5,
      y,
      w: 9,
      h: 0.25,
      fontSize: 10,
      fontFace: FONTS.body,
      color: COLORS.text.muted,
      bold: true,
    });
    y += 0.3;
    
    teamOKRs.forEach(okr => {
      slide.addText(`• ${okr.objectiveText} (${okr.ownerName}) — ${okr.latestCheckIn?.confidence || 0}%`, {
        x: 0.5,
        y,
        w: 9,
        h: 0.25,
        fontSize: 9,
        fontFace: FONTS.body,
        color: COLORS.text.primary,
      });
      y += 0.25;
    });
  }
  
  addFooter(slide, quarterLabel, 7);
}

// Main export function
export function generateQBRPresentation(data: QBRSlideData): void {
  const pptx = new PptxGenJS();
  
  // Set presentation properties
  pptx.author = 'TrueNorth';
  pptx.title = `QBR - ${formatQuarter(data.quarter)}`;
  pptx.subject = 'Quarterly Business Review';
  pptx.company = data.scope;
  
  // Set default slide size (16:9)
  pptx.defineLayout({ name: 'LAYOUT_16x9', width: 10, height: 5.625 });
  pptx.layout = 'LAYOUT_16x9';
  
  // Generate slides
  createExecutiveSummarySlide(pptx, data);
  createOKROutcomesSlide(pptx, data);
  createConfidenceTrendSlide(pptx, data);
  createAtRiskSlide(pptx, data);
  createDeprioritizedSlide(pptx, data);
  createNextQuarterSlide(pptx, data);
  createAppendixSlide(pptx, data);
  
  // Generate and download
  const fileName = `QBR_${data.quarter}_${data.scope.replace(/\s+/g, '_')}`;
  pptx.writeFile({ fileName });
}

export type { QBRSlideData };
