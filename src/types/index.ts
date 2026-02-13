export type Quarter = 'Q1' | 'Q2' | 'Q3' | 'Q4';
export type OKRLevel = 'productArea' | 'domain' | 'team';
export type ConfidenceLabel = 'High' | 'Medium' | 'Low';
export type AchievementStatus = 'achieved' | 'missed' | 'partially_achieved';
export type OKRStatus = 'active' | 'closed';

export interface QuarterClose {
  id: string;
  okrId: string;
  finalValue: number;
  achievement: AchievementStatus;
  summary: string;
  closedBy: string | null;
  closedAt: string;
  reopenedAt: string | null;
}
export type RootCauseCategory =
  | 'capacity'
  | 'dependency'
  | 'vendor'
  | 'compliance'
  | 'strategy_shift'
  | 'technical_debt'
  | 'data_quality'
  | 'scope_change';

export const ROOT_CAUSE_LABELS: Record<RootCauseCategory, string> = {
  capacity: 'Capacity',
  dependency: 'Dependency',
  vendor: 'Vendor',
  compliance: 'Compliance',
  strategy_shift: 'Strategy Shift',
  technical_debt: 'Technical Debt',
  data_quality: 'Data Quality',
  scope_change: 'Scope Change',
};

export type Cadence = 'weekly' | 'biweekly';
export type TrendDirection = 'up' | 'down' | 'flat';
export type ViewMode = 'team' | 'exec';

export interface ProductArea {
  id: string;
  name: string;
}

export interface Domain {
  id: string;
  name: string;
  productAreaId: string;
}

export interface Team {
  id: string;
  name: string;
  domainId: string;
  pmName: string;
  cadence: Cadence;
}

export interface KeyResult {
  id: string;
  okrId: string;
  text: string;
  targetValue: number;
  currentValue: number;
  needsAttention?: boolean;
  attentionReason?: string;
}

export interface CheckIn {
  id: string;
  okrId: string;
  date: string;
  cadence: Cadence;
  progress: number; // 0-100
  confidence: number; // 0-100
  confidenceLabel: ConfidenceLabel;
  reasonForChange?: string;
  optionalNote?: string;
  rootCause?: RootCauseCategory | null;
  rootCauseNote?: string | null;
  recoveryLikelihood?: string | null;
}

export interface OKR {
  id: string;
  level: OKRLevel;
  ownerId: string; // productAreaId, domainId, or teamId
  quarter: string; // e.g., "2024-Q1"
  year: number;
  quarterNum: Quarter;
  objectiveText: string;
  parentOkrId?: string;
  isRolledOver?: boolean;
  rolledOverFrom?: string;
  status: OKRStatus;
}

export interface OKRLink {
  id: string;
  parentOkrId: string;
  childOkrId: string;
}

export interface JiraLink {
  id: string;
  okrId: string;
  epicIdentifierOrUrl: string;
}

// Computed types
export interface OKRWithDetails extends OKR {
  ownerName: string;
  keyResults: KeyResult[];
  checkIns: CheckIn[];
  jiraLinks: JiraLink[];
  latestCheckIn?: CheckIn;
  previousCheckIn?: CheckIn;
  trend: TrendDirection;
  isOrphaned: boolean;
  childOKRs: OKRWithDetails[];
  quarterClose?: QuarterClose;
}

export interface TeamWithOKRs extends Team {
  okrs: OKRWithDetails[];
  overallConfidence: number;
  atRiskCount: number;
}

export interface DomainWithTeams extends Domain {
  teams: TeamWithOKRs[];
  okrs: OKRWithDetails[];
  overallConfidence: number;
  atRiskCount: number;
}

export interface ProductAreaWithDomains extends ProductArea {
  domains: DomainWithTeams[];
  okrs: OKRWithDetails[];
  overallConfidence: number;
  atRiskCount: number;
}

// Utility functions
export function getConfidenceLabel(confidence: number): ConfidenceLabel {
  if (confidence >= 75) return 'High';
  if (confidence >= 40) return 'Medium';
  return 'Low';
}

export function getTrend(current?: CheckIn, previous?: CheckIn): TrendDirection {
  if (!current || !previous) return 'flat';
  if (current.confidence > previous.confidence) return 'up';
  if (current.confidence < previous.confidence) return 'down';
  return 'flat';
}

export function formatQuarter(quarter: string): string {
  const [year, q] = quarter.split('-');
  return `${q} ${year}`;
}

export function getCurrentQuarter(): string {
  const now = new Date();
  const quarter = Math.ceil((now.getMonth() + 1) / 3);
  return `${now.getFullYear()}-Q${quarter}`;
}

export function getNextQuarter(quarter: string): string {
  const [year, q] = quarter.split('-');
  const qNum = parseInt(q.replace('Q', ''));
  if (qNum === 4) {
    return `${parseInt(year) + 1}-Q1`;
  }
  return `${year}-Q${qNum + 1}`;
}

export function getPreviousQuarter(quarter: string): string {
  const [year, q] = quarter.split('-');
  const qNum = parseInt(q.replace('Q', ''));
  if (qNum === 1) {
    return `${parseInt(year) - 1}-Q4`;
  }
  return `${year}-Q${qNum - 1}`;
}

export function getNextCheckInDate(lastCheckIn: Date, cadence: Cadence): Date {
  const days = cadence === 'weekly' ? 7 : 14;
  const next = new Date(lastCheckIn);
  next.setDate(next.getDate() + days);
  return next;
}
