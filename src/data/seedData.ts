import { 
  ProductArea, 
  Domain, 
  Team, 
  OKR, 
  KeyResult, 
  CheckIn, 
  JiraLink,
  getConfidenceLabel 
} from '@/types';

// Product Areas
export const productAreas: ProductArea[] = [
  { id: 'pa-1', name: 'Booking' }
];

// Domains
export const domains: Domain[] = [
  { id: 'd-1', name: 'Booking Funnel', productAreaId: 'pa-1' }
];

// Teams
export const teams: Team[] = [
  { id: 't-1', name: 'Booking Experience', domainId: 'd-1', pmName: 'Sarah Chen', cadence: 'biweekly' },
  { id: 't-2', name: 'Payments', domainId: 'd-1', pmName: 'Marcus Johnson', cadence: 'biweekly' },
  { id: 't-3', name: 'Search', domainId: 'd-1', pmName: 'Emily Rodriguez', cadence: 'weekly' }
];

const currentQuarter = '2026-Q1';

// ============================================================================
// Q1 2026 SCENARIO: Marriott-style Product Operating Model Demo
// ============================================================================
// Narrative: A realistic quarter showing how confidence tracking surfaces
// risk early and enables evidence-based QBR conversations.
//
// - Search: On track, high confidence throughout
// - Booking Experience: Mixed, recovering after mid-quarter dip  
// - Payments: At risk, struggling with vendor dependencies
// ============================================================================

// OKRs
export const okrs: OKR[] = [
  // ========== Domain OKR ==========
  {
    id: 'okr-domain-q1',
    level: 'domain',
    ownerId: 'd-1',
    quarter: currentQuarter,
    year: 2026,
    quarterNum: 'Q1',
    objectiveText: 'Increase direct digital bookings'
  },
  
  // ========== Team OKRs ==========
  
  // Booking Experience - Mixed, recovering
  {
    id: 'okr-booking-exp',
    level: 'team',
    ownerId: 't-1',
    quarter: currentQuarter,
    year: 2026,
    quarterNum: 'Q1',
    objectiveText: 'Improve booking conversion rate',
    parentOkrId: 'okr-domain-q1'
  },
  
  // Payments - At risk
  {
    id: 'okr-payments',
    level: 'team',
    ownerId: 't-2',
    quarter: currentQuarter,
    year: 2026,
    quarterNum: 'Q1',
    objectiveText: 'Reduce payment-related booking failures',
    parentOkrId: 'okr-domain-q1'
  },
  
  // Search - On track
  {
    id: 'okr-search',
    level: 'team',
    ownerId: 't-3',
    quarter: currentQuarter,
    year: 2026,
    quarterNum: 'Q1',
    objectiveText: 'Increase qualified traffic into the booking funnel',
    parentOkrId: 'okr-domain-q1'
  }
];

// Key Results with "Needs Attention" flags for demo
export const keyResults: KeyResult[] = [
  // Domain KRs
  { id: 'kr-domain-1', okrId: 'okr-domain-q1', text: 'Improve overall booking conversion', targetValue: 22, currentValue: 19.2 },
  { id: 'kr-domain-2', okrId: 'okr-domain-q1', text: 'Reduce funnel abandonment', targetValue: 20, currentValue: 26 },
  
  // Booking Experience KRs
  { id: 'kr-booking-1', okrId: 'okr-booking-exp', text: 'Increase completed bookings from 18% to 22%', targetValue: 22, currentValue: 19.8 },
  { id: 'kr-booking-2', okrId: 'okr-booking-exp', text: 'Reduce checkout abandonment from 30% to 20%', targetValue: 20, currentValue: 24, needsAttention: true, attentionReason: 'Mobile checkout still underperforming; investigating payment step friction.' },
  
  // Payments KRs - at risk, needs attention
  { id: 'kr-payments-1', okrId: 'okr-payments', text: 'Reduce payment error rate from 4.5% to 2.5%', targetValue: 2.5, currentValue: 3.2, needsAttention: true, attentionReason: 'Gateway v2.3 rollout delayed; vendor escalation ongoing.' },
  { id: 'kr-payments-2', okrId: 'okr-payments', text: 'Increase successful retry completion from 40% to 65%', targetValue: 65, currentValue: 52, needsAttention: true, attentionReason: 'Blocked on gateway stability before full retry logic deployment.' },
  
  // Search KRs - on track
  { id: 'kr-search-1', okrId: 'okr-search', text: 'Increase search-to-booking handoff rate from 12% to 16%', targetValue: 16, currentValue: 14.8 },
  { id: 'kr-search-2', okrId: 'okr-search', text: 'Reduce irrelevant search results by 20%', targetValue: 20, currentValue: 18 }
];

// Check-ins with history showing confidence changes
export const checkIns: CheckIn[] = [
  // ========================================================================
  // BOOKING EXPERIENCE: Mixed journey, recovering after mid-quarter dip
  // Story: Started strong, mobile experiments underperformed, iterated to recover
  // ========================================================================
  {
    id: 'ci-booking-1',
    okrId: 'okr-booking-exp',
    date: '2026-01-13',
    cadence: 'biweekly',
    progress: 10,
    confidence: 75,
    confidenceLabel: 'High',
    reasonForChange: 'Initial experiments show promise in guest checkout simplification.',
    optionalNote: 'A/B tests launched on simplified guest checkout. Early signals positive.'
  },
  {
    id: 'ci-booking-2',
    okrId: 'okr-booking-exp',
    date: '2026-01-27',
    cadence: 'biweekly',
    progress: 28,
    confidence: 68,
    confidenceLabel: 'Medium',
    reasonForChange: 'Mobile conversion lagging desktop; investigating payment step drop-off.',
    optionalNote: 'Desktop conversion up 1.2pp. Mobile flat. Focus shifting to payment integration friction.'
  },
  {
    id: 'ci-booking-3',
    okrId: 'okr-booking-exp',
    date: '2026-02-10',
    cadence: 'biweekly',
    progress: 42,
    confidence: 60,
    confidenceLabel: 'Medium',
    reasonForChange: 'Mobile checkout experiments underperformed assumptions; payment retries adding friction.',
    optionalNote: 'Conversion lift was 0.8% vs expected 2.2%. Payment retry modal causing 15% additional abandonment on mobile.'
  },
  {
    id: 'ci-booking-4',
    okrId: 'okr-booking-exp',
    date: '2026-02-24',
    cadence: 'biweekly',
    progress: 55,
    confidence: 65,
    confidenceLabel: 'Medium',
    reasonForChange: 'Iterated mobile flow stabilized; desktop gains offset mobile drag.',
    optionalNote: 'Removed inline retry modal. Desktop now +1.8pp. Mobile stabilizing at +0.4pp. On pace for 20% vs 22% target.'
  },
  
  // ========================================================================
  // PAYMENTS: At risk journey with vendor dependencies
  // Story: Gateway instability and vendor delays created sustained risk
  // ========================================================================
  {
    id: 'ci-payments-1',
    okrId: 'okr-payments',
    date: '2026-01-13',
    cadence: 'biweekly',
    progress: 15,
    confidence: 55,
    confidenceLabel: 'Medium',
    reasonForChange: 'Baseline improvements identified; dependency on gateway updates.',
    optionalNote: 'Initial retry logic spec complete. Waiting on gateway v2.3 release for full implementation.'
  },
  {
    id: 'ci-payments-2',
    okrId: 'okr-payments',
    date: '2026-01-27',
    cadence: 'biweekly',
    progress: 22,
    confidence: 45,
    confidenceLabel: 'Medium',
    reasonForChange: 'Gateway update delayed to mid-February; interim workarounds limited.',
    optionalNote: 'Vendor confirmed 2-week delay. Pursuing client-side retry as stopgap.'
  },
  {
    id: 'ci-payments-3',
    okrId: 'okr-payments',
    date: '2026-02-10',
    cadence: 'biweekly',
    progress: 30,
    confidence: 35,
    confidenceLabel: 'Low',
    reasonForChange: 'Unexpected gateway instability and vendor delays impacting retry logic.',
    optionalNote: 'Gateway v2.3 rollout caused 2-day outage. Error rate spiked to 6.2%. Vendor escalation in progress.'
  },
  {
    id: 'ci-payments-4',
    okrId: 'okr-payments',
    date: '2026-02-24',
    cadence: 'biweekly',
    progress: 45,
    confidence: 40,
    confidenceLabel: 'Medium',
    reasonForChange: 'Mitigations in place; full impact expected next quarter.',
    optionalNote: 'Gateway stable. Error rate back to 3.2%. Retry logic partially deployed. Full rollout Q2.'
  },
  
  // ========================================================================
  // SEARCH: Consistent high performer
  // Story: Ranking model improvements delivering sustained gains
  // ========================================================================
  {
    id: 'ci-search-1',
    okrId: 'okr-search',
    date: '2026-01-06',
    cadence: 'weekly',
    progress: 20,
    confidence: 80,
    confidenceLabel: 'High',
    reasonForChange: 'Ranking model updates performing above expectations.',
    optionalNote: 'New relevance model live. Click-through up 8% week-over-week.'
  },
  {
    id: 'ci-search-2',
    okrId: 'okr-search',
    date: '2026-01-13',
    cadence: 'weekly',
    progress: 28,
    confidence: 80,
    confidenceLabel: 'High',
    optionalNote: 'Gains holding. Irrelevant result rate down 12%.'
  },
  {
    id: 'ci-search-3',
    okrId: 'okr-search',
    date: '2026-01-20',
    cadence: 'weekly',
    progress: 35,
    confidence: 82,
    confidenceLabel: 'High',
    reasonForChange: 'Sustained gains in relevance and click-through.',
    optionalNote: 'Search-to-booking handoff at 13.8%, up from 12% baseline.'
  },
  {
    id: 'ci-search-4',
    okrId: 'okr-search',
    date: '2026-01-27',
    cadence: 'weekly',
    progress: 42,
    confidence: 82,
    confidenceLabel: 'High',
    optionalNote: 'Personalization layer showing early promise in test segment.'
  },
  {
    id: 'ci-search-5',
    okrId: 'okr-search',
    date: '2026-02-03',
    cadence: 'weekly',
    progress: 50,
    confidence: 82,
    confidenceLabel: 'High',
    reasonForChange: 'Sustained gains in relevance and click-through.',
    optionalNote: 'Handoff rate at 14.2%. On track for 16% target.'
  },
  {
    id: 'ci-search-6',
    okrId: 'okr-search',
    date: '2026-02-10',
    cadence: 'weekly',
    progress: 58,
    confidence: 84,
    confidenceLabel: 'High',
    reasonForChange: 'Personalization rollout boosting conversion in returning guest segment.',
    optionalNote: 'Returning guests now 18% higher handoff rate. Expanding rollout.'
  },
  {
    id: 'ci-search-7',
    okrId: 'okr-search',
    date: '2026-02-17',
    cadence: 'weekly',
    progress: 65,
    confidence: 85,
    confidenceLabel: 'High',
    optionalNote: 'Handoff rate at 14.6%. Irrelevant results down 17%.'
  },
  {
    id: 'ci-search-8',
    okrId: 'okr-search',
    date: '2026-02-24',
    cadence: 'weekly',
    progress: 70,
    confidence: 85,
    confidenceLabel: 'High',
    reasonForChange: 'Improvements holding across segments.',
    optionalNote: 'Final push on mobile relevance. Confident in hitting both KRs.'
  },
  
  // ========================================================================
  // DOMAIN: Aggregated confidence reflecting team mix
  // ========================================================================
  {
    id: 'ci-domain-1',
    okrId: 'okr-domain-q1',
    date: '2026-01-27',
    cadence: 'biweekly',
    progress: 25,
    confidence: 68,
    confidenceLabel: 'Medium',
    optionalNote: 'Search strong, Booking Experience on track, Payments emerging risk.'
  },
  {
    id: 'ci-domain-2',
    okrId: 'okr-domain-q1',
    date: '2026-02-10',
    cadence: 'biweekly',
    progress: 40,
    confidence: 58,
    confidenceLabel: 'Medium',
    reasonForChange: 'Payments gateway issues impacting overall funnel confidence.',
    optionalNote: 'Payment failures creating downstream impact on booking completion.'
  },
  {
    id: 'ci-domain-3',
    okrId: 'okr-domain-q1',
    date: '2026-02-24',
    cadence: 'biweekly',
    progress: 55,
    confidence: 62,
    confidenceLabel: 'Medium',
    reasonForChange: 'Payments stabilizing; overall trajectory recovering.',
    optionalNote: 'Search gains offsetting some payments drag. Booking Experience recovered momentum.'
  }
];

// Jira Links (optional - keeping minimal for demo clarity)
export const jiraLinks: JiraLink[] = [
  { id: 'jl-1', okrId: 'okr-booking-exp', epicIdentifierOrUrl: 'BOOK-2401' },
  { id: 'jl-2', okrId: 'okr-booking-exp', epicIdentifierOrUrl: 'BOOK-2415' },
  { id: 'jl-3', okrId: 'okr-payments', epicIdentifierOrUrl: 'PAY-890' },
  { id: 'jl-4', okrId: 'okr-search', epicIdentifierOrUrl: 'SRCH-445' }
];

// Helper to calculate aggregated confidence for a set of OKRs
export function calculateAggregateConfidence(okrIds: string[], allCheckIns: CheckIn[]): number {
  const latestCheckIns = okrIds.map(okrId => {
    const okrCheckIns = allCheckIns.filter(ci => ci.okrId === okrId);
    return okrCheckIns.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];
  }).filter(Boolean);
  
  if (latestCheckIns.length === 0) return 0;
  
  const sum = latestCheckIns.reduce((acc, ci) => acc + ci.confidence, 0);
  return Math.round(sum / latestCheckIns.length);
}

// Helper to count at-risk OKRs
export function countAtRisk(okrIds: string[], allCheckIns: CheckIn[]): number {
  return okrIds.filter(okrId => {
    const okrCheckIns = allCheckIns.filter(ci => ci.okrId === okrId);
    const latest = okrCheckIns.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];
    return latest && latest.confidence < 40;
  }).length;
}
