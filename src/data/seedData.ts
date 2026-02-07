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

const currentQuarter = '2024-Q4';

// OKRs
export const okrs: OKR[] = [
  // Product Area OKR
  {
    id: 'okr-pa-1',
    level: 'productArea',
    ownerId: 'pa-1',
    quarter: currentQuarter,
    year: 2024,
    quarterNum: 'Q4',
    objectiveText: 'Become the market leader in booking conversion rate'
  },
  
  // Domain OKR
  {
    id: 'okr-d-1',
    level: 'domain',
    ownerId: 'd-1',
    quarter: currentQuarter,
    year: 2024,
    quarterNum: 'Q4',
    objectiveText: 'Optimize the end-to-end booking funnel for conversion',
    parentOkrId: 'okr-pa-1'
  },
  
  // Team OKRs - Booking Experience
  {
    id: 'okr-t1-1',
    level: 'team',
    ownerId: 't-1',
    quarter: currentQuarter,
    year: 2024,
    quarterNum: 'Q4',
    objectiveText: 'Reduce booking abandonment through UX improvements',
    parentOkrId: 'okr-d-1'
  },
  {
    id: 'okr-t1-2',
    level: 'team',
    ownerId: 't-1',
    quarter: currentQuarter,
    year: 2024,
    quarterNum: 'Q4',
    objectiveText: 'Launch mobile-first booking redesign',
    parentOkrId: 'okr-d-1'
  },
  
  // Team OKRs - Payments
  {
    id: 'okr-t2-1',
    level: 'team',
    ownerId: 't-2',
    quarter: currentQuarter,
    year: 2024,
    quarterNum: 'Q4',
    objectiveText: 'Increase payment success rate to 98%',
    parentOkrId: 'okr-d-1'
  },
  {
    id: 'okr-t2-2',
    level: 'team',
    ownerId: 't-2',
    quarter: currentQuarter,
    year: 2024,
    quarterNum: 'Q4',
    objectiveText: 'Launch 3 new payment methods for EU markets'
    // This is an orphaned OKR - no parentOkrId
  },
  
  // Team OKRs - Search
  {
    id: 'okr-t3-1',
    level: 'team',
    ownerId: 't-3',
    quarter: currentQuarter,
    year: 2024,
    quarterNum: 'Q4',
    objectiveText: 'Improve search relevance and speed',
    parentOkrId: 'okr-d-1'
  },
  {
    id: 'okr-t3-2',
    level: 'team',
    ownerId: 't-3',
    quarter: currentQuarter,
    year: 2024,
    quarterNum: 'Q4',
    objectiveText: 'Implement AI-powered search suggestions',
    parentOkrId: 'okr-d-1'
  }
];

// Key Results
export const keyResults: KeyResult[] = [
  // Product Area KRs
  { id: 'kr-pa-1-1', okrId: 'okr-pa-1', text: 'Increase overall conversion rate from 4.2% to 5.5%', targetValue: 5.5, currentValue: 4.8 },
  { id: 'kr-pa-1-2', okrId: 'okr-pa-1', text: 'Reduce booking time from 8 min to 5 min', targetValue: 5, currentValue: 6.2 },
  
  // Domain KRs
  { id: 'kr-d-1-1', okrId: 'okr-d-1', text: 'Increase funnel completion rate to 65%', targetValue: 65, currentValue: 58 },
  { id: 'kr-d-1-2', okrId: 'okr-d-1', text: 'Reduce cart abandonment to under 40%', targetValue: 40, currentValue: 45 },
  
  // Booking Experience KRs
  { id: 'kr-t1-1-1', okrId: 'okr-t1-1', text: 'Reduce form fields from 12 to 6', targetValue: 6, currentValue: 8 },
  { id: 'kr-t1-1-2', okrId: 'okr-t1-1', text: 'Increase step completion rate to 85%', targetValue: 85, currentValue: 78 },
  { id: 'kr-t1-2-1', okrId: 'okr-t1-2', text: 'Launch mobile redesign to 100% of users', targetValue: 100, currentValue: 60 },
  { id: 'kr-t1-2-2', okrId: 'okr-t1-2', text: 'Achieve 4.5+ app store rating', targetValue: 4.5, currentValue: 4.2 },
  
  // Payments KRs
  { id: 'kr-t2-1-1', okrId: 'okr-t2-1', text: 'Reduce payment failures to under 2%', targetValue: 2, currentValue: 3.5 },
  { id: 'kr-t2-1-2', okrId: 'okr-t2-1', text: 'Implement retry logic for 95% of failure types', targetValue: 95, currentValue: 70 },
  { id: 'kr-t2-2-1', okrId: 'okr-t2-2', text: 'Launch Apple Pay, Google Pay, and Klarna', targetValue: 3, currentValue: 1 },
  { id: 'kr-t2-2-2', okrId: 'okr-t2-2', text: 'Process €1M through new methods', targetValue: 1000000, currentValue: 150000 },
  
  // Search KRs
  { id: 'kr-t3-1-1', okrId: 'okr-t3-1', text: 'Reduce search latency to under 200ms (p95)', targetValue: 200, currentValue: 280 },
  { id: 'kr-t3-1-2', okrId: 'okr-t3-1', text: 'Increase search-to-booking rate to 12%', targetValue: 12, currentValue: 9.5 },
  { id: 'kr-t3-2-1', okrId: 'okr-t3-2', text: 'Launch AI suggestions to 50% of users', targetValue: 50, currentValue: 25 },
  { id: 'kr-t3-2-2', okrId: 'okr-t3-2', text: 'Achieve 40% suggestion click-through rate', targetValue: 40, currentValue: 32 }
];

// Check-ins with history showing confidence changes
export const checkIns: CheckIn[] = [
  // OKR okr-t1-1: Shows confidence drop with reason
  {
    id: 'ci-1',
    okrId: 'okr-t1-1',
    date: '2024-10-07',
    cadence: 'biweekly',
    progress: 45,
    confidence: 80,
    confidenceLabel: 'High',
    optionalNote: 'Good progress on form simplification'
  },
  {
    id: 'ci-2',
    okrId: 'okr-t1-1',
    date: '2024-10-21',
    cadence: 'biweekly',
    progress: 55,
    confidence: 75,
    confidenceLabel: 'High',
    reasonForChange: 'Design review identified additional complexity',
    optionalNote: 'Need more engineering support'
  },
  {
    id: 'ci-3',
    okrId: 'okr-t1-1',
    date: '2024-11-04',
    cadence: 'biweekly',
    progress: 58,
    confidence: 55,
    confidenceLabel: 'Medium',
    reasonForChange: 'Lost one engineer to another priority; timeline at risk'
  },
  {
    id: 'ci-4',
    okrId: 'okr-t1-1',
    date: '2024-11-18',
    cadence: 'biweekly',
    progress: 65,
    confidence: 60,
    confidenceLabel: 'Medium',
    reasonForChange: 'Got partial engineering support back',
    optionalNote: 'Should be able to recover if no more blockers'
  },
  
  // OKR okr-t1-2
  {
    id: 'ci-5',
    okrId: 'okr-t1-2',
    date: '2024-10-07',
    cadence: 'biweekly',
    progress: 30,
    confidence: 85,
    confidenceLabel: 'High'
  },
  {
    id: 'ci-6',
    okrId: 'okr-t1-2',
    date: '2024-10-21',
    cadence: 'biweekly',
    progress: 45,
    confidence: 85,
    confidenceLabel: 'High',
    optionalNote: 'On track for 100% rollout'
  },
  {
    id: 'ci-7',
    okrId: 'okr-t1-2',
    date: '2024-11-04',
    cadence: 'biweekly',
    progress: 55,
    confidence: 80,
    confidenceLabel: 'High',
    reasonForChange: 'Minor delays in QA cycle'
  },
  {
    id: 'ci-8',
    okrId: 'okr-t1-2',
    date: '2024-11-18',
    cadence: 'biweekly',
    progress: 60,
    confidence: 80,
    confidenceLabel: 'High'
  },
  
  // OKR okr-t2-1
  {
    id: 'ci-9',
    okrId: 'okr-t2-1',
    date: '2024-10-07',
    cadence: 'biweekly',
    progress: 40,
    confidence: 70,
    confidenceLabel: 'Medium'
  },
  {
    id: 'ci-10',
    okrId: 'okr-t2-1',
    date: '2024-10-21',
    cadence: 'biweekly',
    progress: 50,
    confidence: 65,
    confidenceLabel: 'Medium',
    reasonForChange: 'Payment provider API issues discovered'
  },
  {
    id: 'ci-11',
    okrId: 'okr-t2-1',
    date: '2024-11-04',
    cadence: 'biweekly',
    progress: 55,
    confidence: 55,
    confidenceLabel: 'Medium',
    reasonForChange: 'Still waiting on provider fix; exploring workarounds'
  },
  {
    id: 'ci-12',
    okrId: 'okr-t2-1',
    date: '2024-11-18',
    cadence: 'biweekly',
    progress: 60,
    confidence: 60,
    confidenceLabel: 'Medium',
    reasonForChange: 'Workaround implemented; cautiously optimistic',
    optionalNote: 'Provider promised fix by EOQ'
  },
  
  // OKR okr-t2-2 (orphaned) - shows at-risk
  {
    id: 'ci-13',
    okrId: 'okr-t2-2',
    date: '2024-10-07',
    cadence: 'biweekly',
    progress: 20,
    confidence: 50,
    confidenceLabel: 'Medium'
  },
  {
    id: 'ci-14',
    okrId: 'okr-t2-2',
    date: '2024-10-21',
    cadence: 'biweekly',
    progress: 25,
    confidence: 40,
    confidenceLabel: 'Medium',
    reasonForChange: 'Regulatory review taking longer than expected'
  },
  {
    id: 'ci-15',
    okrId: 'okr-t2-2',
    date: '2024-11-04',
    cadence: 'biweekly',
    progress: 30,
    confidence: 30,
    confidenceLabel: 'Low',
    reasonForChange: 'Klarna integration blocked by legal review; may slip to Q1'
  },
  {
    id: 'ci-16',
    okrId: 'okr-t2-2',
    date: '2024-11-18',
    cadence: 'biweekly',
    progress: 33,
    confidence: 25,
    confidenceLabel: 'Low',
    reasonForChange: 'Legal confirmed Klarna blocked until Q1; pivoting scope'
  },
  
  // OKR okr-t3-1 (weekly cadence)
  {
    id: 'ci-17',
    okrId: 'okr-t3-1',
    date: '2024-10-28',
    cadence: 'weekly',
    progress: 50,
    confidence: 75,
    confidenceLabel: 'High'
  },
  {
    id: 'ci-18',
    okrId: 'okr-t3-1',
    date: '2024-11-04',
    cadence: 'weekly',
    progress: 58,
    confidence: 75,
    confidenceLabel: 'High'
  },
  {
    id: 'ci-19',
    okrId: 'okr-t3-1',
    date: '2024-11-11',
    cadence: 'weekly',
    progress: 65,
    confidence: 80,
    confidenceLabel: 'High',
    reasonForChange: 'New caching layer showing great results',
    optionalNote: 'Already seeing 15% latency reduction'
  },
  {
    id: 'ci-20',
    okrId: 'okr-t3-1',
    date: '2024-11-18',
    cadence: 'weekly',
    progress: 72,
    confidence: 85,
    confidenceLabel: 'High',
    reasonForChange: 'Ahead of schedule',
    optionalNote: 'May exceed target'
  },
  
  // OKR okr-t3-2
  {
    id: 'ci-21',
    okrId: 'okr-t3-2',
    date: '2024-10-28',
    cadence: 'weekly',
    progress: 35,
    confidence: 70,
    confidenceLabel: 'Medium'
  },
  {
    id: 'ci-22',
    okrId: 'okr-t3-2',
    date: '2024-11-04',
    cadence: 'weekly',
    progress: 42,
    confidence: 70,
    confidenceLabel: 'Medium'
  },
  {
    id: 'ci-23',
    okrId: 'okr-t3-2',
    date: '2024-11-11',
    cadence: 'weekly',
    progress: 48,
    confidence: 75,
    confidenceLabel: 'High',
    reasonForChange: 'ML model accuracy better than expected'
  },
  {
    id: 'ci-24',
    okrId: 'okr-t3-2',
    date: '2024-11-18',
    cadence: 'weekly',
    progress: 55,
    confidence: 78,
    confidenceLabel: 'High',
    reasonForChange: 'Rolled out to 30% successfully'
  },
  
  // Domain OKR
  {
    id: 'ci-25',
    okrId: 'okr-d-1',
    date: '2024-11-04',
    cadence: 'biweekly',
    progress: 55,
    confidence: 65,
    confidenceLabel: 'Medium'
  },
  {
    id: 'ci-26',
    okrId: 'okr-d-1',
    date: '2024-11-18',
    cadence: 'biweekly',
    progress: 62,
    confidence: 68,
    confidenceLabel: 'Medium',
    reasonForChange: 'Team OKRs showing mixed progress',
    optionalNote: 'Payments team at risk affecting overall funnel'
  },
  
  // Product Area OKR
  {
    id: 'ci-27',
    okrId: 'okr-pa-1',
    date: '2024-11-04',
    cadence: 'biweekly',
    progress: 50,
    confidence: 60,
    confidenceLabel: 'Medium'
  },
  {
    id: 'ci-28',
    okrId: 'okr-pa-1',
    date: '2024-11-18',
    cadence: 'biweekly',
    progress: 58,
    confidence: 62,
    confidenceLabel: 'Medium',
    reasonForChange: 'Conversion improvements tracking, but timeline tight'
  }
];

// Jira Links
export const jiraLinks: JiraLink[] = [
  { id: 'jl-1', okrId: 'okr-t1-1', epicIdentifierOrUrl: 'BOOK-1234' },
  { id: 'jl-2', okrId: 'okr-t1-1', epicIdentifierOrUrl: 'BOOK-1235' },
  { id: 'jl-3', okrId: 'okr-t1-2', epicIdentifierOrUrl: 'https://jira.company.com/browse/BOOK-1300' },
  { id: 'jl-4', okrId: 'okr-t2-1', epicIdentifierOrUrl: 'PAY-500' },
  { id: 'jl-5', okrId: 'okr-t3-1', epicIdentifierOrUrl: 'SRCH-200' },
  { id: 'jl-6', okrId: 'okr-t3-2', epicIdentifierOrUrl: 'SRCH-201' },
  { id: 'jl-7', okrId: 'okr-t3-2', epicIdentifierOrUrl: 'ML-100' }
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
