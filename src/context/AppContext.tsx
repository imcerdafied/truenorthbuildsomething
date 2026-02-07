import React, { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { checkDemoMode } from '@/hooks/useDemoMode';
import * as seedData from '@/data/seedData';
import {
  ProductArea,
  Domain,
  Team,
  OKR,
  KeyResult,
  CheckIn,
  JiraLink,
  ViewMode,
  OKRWithDetails,
  OKRLevel,
  Quarter,
  Cadence,
  getConfidenceLabel,
  getTrend,
  getCurrentQuarter
} from '@/types';

export interface CreateOKRData {
  level: OKRLevel;
  ownerId: string;
  quarter: string;
  objectiveText: string;
  keyResults: { metricName: string; baseline?: string; target: string }[];
  parentOkrId?: string;
  initialConfidence: number;
}

interface AppState {
  productAreas: ProductArea[];
  domains: Domain[];
  teams: Team[];
  okrs: OKR[];
  keyResults: KeyResult[];
  checkIns: CheckIn[];
  jiraLinks: JiraLink[];
  viewMode: ViewMode;
  currentQuarter: string;
  selectedTeamId: string;
  currentPM: string;
  isDemoMode: boolean;
  isLoading: boolean;
}

interface AppContextType extends AppState {
  setViewMode: (mode: ViewMode) => void;
  setCurrentQuarter: (quarter: string) => void;
  setSelectedTeamId: (teamId: string) => void;
  refreshData: () => Promise<void>;
  
  // OKR operations
  getOKRWithDetails: (okrId: string) => OKRWithDetails | null;
  getOKRsByLevel: (level: OKR['level'], ownerId?: string) => OKRWithDetails[];
  getOKRsByQuarter: (quarter: string) => OKRWithDetails[];
  getTeamOKRs: (teamId: string) => OKRWithDetails[];
  createOKR: (data: CreateOKRData) => string;
  
  // Check-in operations
  addCheckIn: (checkIn: Omit<CheckIn, 'id' | 'confidenceLabel'>) => void;
  
  // Team operations
  getTeam: (teamId: string) => Team | undefined;
  updateTeamCadence: (teamId: string, cadence: 'weekly' | 'biweekly') => void;
  
  // Linking operations
  addOKRLink: (parentOkrId: string, childOkrId: string) => void;
  addJiraLink: (okrId: string, epicIdentifierOrUrl: string) => void;
  removeJiraLink: (linkId: string) => void;
  
  // Rollover operations
  rolloverOKR: (okrId: string) => void;
  
  // Aggregations
  getOverallConfidence: (okrIds: string[]) => number;
  getAtRiskCount: (okrIds: string[]) => number;
  getOnTrackCount: (okrIds: string[]) => number;
  
  // Ownership
  isCurrentUserPM: (teamId: string) => boolean;
  canEditOKR: (okrId: string) => boolean;
  isDemoMode: boolean;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const { organization, profile } = useAuth();
  const isDemoMode = checkDemoMode();
  
  const [state, setState] = useState<AppState>(() => {
    // Initialize with demo data if in demo mode
    if (isDemoMode) {
      return {
        productAreas: seedData.productAreas,
        domains: seedData.domains,
        teams: seedData.teams,
        okrs: seedData.okrs,
        keyResults: seedData.keyResults,
        checkIns: seedData.checkIns,
        jiraLinks: seedData.jiraLinks,
        viewMode: 'team',
        currentQuarter: '2026-Q1',
        selectedTeamId: seedData.teams[0]?.id || '',
        currentPM: 'Sarah Chen',
        isLoading: false,
        isDemoMode: true
      };
    }
    
    return {
      productAreas: [],
      domains: [],
      teams: [],
      okrs: [],
      keyResults: [],
      checkIns: [],
      jiraLinks: [],
      viewMode: 'team',
      currentQuarter: getCurrentQuarter(),
      selectedTeamId: '',
      currentPM: '',
      isLoading: true,
      isDemoMode: false
    };
  });

  // Fetch organization structure from database
  const refreshData = useCallback(async () => {
    // Skip fetching if in demo mode
    if (isDemoMode) {
      return;
    }
    
    if (!organization?.id) {
      setState(prev => ({ ...prev, isLoading: false }));
      return;
    }

    try {
      // Fetch product areas
      const { data: paData } = await supabase
        .from('product_areas')
        .select('*')
        .eq('organization_id', organization.id)
        .order('name');

      const productAreas: ProductArea[] = (paData || []).map(pa => ({
        id: pa.id,
        name: pa.name
      }));

      // Fetch domains
      const { data: domainData } = await supabase
        .from('domains')
        .select('*')
        .in('product_area_id', productAreas.map(pa => pa.id))
        .order('name');

      const domains: Domain[] = (domainData || []).map(d => ({
        id: d.id,
        name: d.name,
        productAreaId: d.product_area_id
      }));

      // Fetch teams
      const { data: teamData } = await supabase
        .from('teams')
        .select('*')
        .in('domain_id', domains.map(d => d.id))
        .order('name');

      const teams: Team[] = (teamData || []).map(t => ({
        id: t.id,
        name: t.name,
        domainId: t.domain_id,
        pmName: t.pm_name || '',
        cadence: (t.cadence || 'biweekly') as Cadence
      }));

      // Set default selected team
      const firstTeamId = teams.length > 0 ? teams[0].id : '';

      setState(prev => ({
        ...prev,
        productAreas,
        domains,
        teams,
        selectedTeamId: prev.selectedTeamId || firstTeamId,
        currentPM: profile?.full_name || '',
        isLoading: false,
        isDemoMode: false
      }));
    } catch (error) {
      console.error('Error fetching organization data:', error);
      setState(prev => ({ ...prev, isLoading: false }));
    }
  }, [organization?.id, profile?.full_name, isDemoMode]);

  // Fetch data when organization changes
  useEffect(() => {
    refreshData();
  }, [refreshData]);

  const setViewMode = useCallback((mode: ViewMode) => {
    setState(prev => ({ ...prev, viewMode: mode }));
  }, []);

  const setCurrentQuarter = useCallback((quarter: string) => {
    setState(prev => ({ ...prev, currentQuarter: quarter }));
  }, []);

  const setSelectedTeamId = useCallback((teamId: string) => {
    setState(prev => ({ ...prev, selectedTeamId: teamId }));
  }, []);

  const getTeam = useCallback((teamId: string) => {
    return state.teams.find(t => t.id === teamId);
  }, [state.teams]);

  const isCurrentUserPM = useCallback((teamId: string) => {
    const team = state.teams.find(t => t.id === teamId);
    return team?.pmName === state.currentPM;
  }, [state.teams, state.currentPM]);

  const canEditOKR = useCallback((okrId: string) => {
    const okr = state.okrs.find(o => o.id === okrId);
    if (!okr) return false;
    if (okr.level === 'team') {
      return isCurrentUserPM(okr.ownerId);
    }
    return true;
  }, [state.okrs, isCurrentUserPM]);

  const getOKRWithDetails = useCallback((okrId: string): OKRWithDetails | null => {
    const okr = state.okrs.find(o => o.id === okrId);
    if (!okr) return null;

    const krs = state.keyResults.filter(kr => kr.okrId === okrId);
    const okrCheckIns = state.checkIns
      .filter(ci => ci.okrId === okrId)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    const links = state.jiraLinks.filter(jl => jl.okrId === okrId);
    
    const latestCheckIn = okrCheckIns[0];
    const previousCheckIn = okrCheckIns[1];

    let ownerName = '';
    if (okr.level === 'team') {
      ownerName = state.teams.find(t => t.id === okr.ownerId)?.name || '';
    } else if (okr.level === 'domain') {
      ownerName = state.domains.find(d => d.id === okr.ownerId)?.name || '';
    } else {
      ownerName = state.productAreas.find(pa => pa.id === okr.ownerId)?.name || '';
    }

    const isOrphaned = okr.level !== 'productArea' && !okr.parentOkrId;

    const childOKRs = state.okrs
      .filter(o => o.parentOkrId === okrId)
      .map(childOkr => getOKRWithDetails(childOkr.id))
      .filter(Boolean) as OKRWithDetails[];

    return {
      ...okr,
      ownerName,
      keyResults: krs,
      checkIns: okrCheckIns,
      jiraLinks: links,
      latestCheckIn,
      previousCheckIn,
      trend: getTrend(latestCheckIn, previousCheckIn),
      isOrphaned,
      childOKRs
    };
  }, [state]);

  const getOKRsByLevel = useCallback((level: OKR['level'], ownerId?: string) => {
    return state.okrs
      .filter(o => o.level === level && o.quarter === state.currentQuarter && (!ownerId || o.ownerId === ownerId))
      .map(o => getOKRWithDetails(o.id))
      .filter(Boolean) as OKRWithDetails[];
  }, [state.okrs, state.currentQuarter, getOKRWithDetails]);

  const getOKRsByQuarter = useCallback((quarter: string) => {
    return state.okrs
      .filter(o => o.quarter === quarter)
      .map(o => getOKRWithDetails(o.id))
      .filter(Boolean) as OKRWithDetails[];
  }, [state.okrs, getOKRWithDetails]);

  const getTeamOKRs = useCallback((teamId: string) => {
    return state.okrs
      .filter(o => o.level === 'team' && o.ownerId === teamId && o.quarter === state.currentQuarter)
      .map(o => getOKRWithDetails(o.id))
      .filter(Boolean) as OKRWithDetails[];
  }, [state.okrs, state.currentQuarter, getOKRWithDetails]);

  const addCheckIn = useCallback((checkIn: Omit<CheckIn, 'id' | 'confidenceLabel'>) => {
    const newCheckIn: CheckIn = {
      ...checkIn,
      id: `ci-${Date.now()}`,
      confidenceLabel: getConfidenceLabel(checkIn.confidence)
    };
    setState(prev => ({
      ...prev,
      checkIns: [...prev.checkIns, newCheckIn]
    }));
  }, []);

  const updateTeamCadence = useCallback((teamId: string, cadence: 'weekly' | 'biweekly') => {
    setState(prev => ({
      ...prev,
      teams: prev.teams.map(t => t.id === teamId ? { ...t, cadence } : t)
    }));
  }, []);

  const addOKRLink = useCallback((parentOkrId: string, childOkrId: string) => {
    setState(prev => ({
      ...prev,
      okrs: prev.okrs.map(o => o.id === childOkrId ? { ...o, parentOkrId } : o)
    }));
  }, []);

  const addJiraLink = useCallback((okrId: string, epicIdentifierOrUrl: string) => {
    const newLink: JiraLink = {
      id: `jl-${Date.now()}`,
      okrId,
      epicIdentifierOrUrl
    };
    setState(prev => ({
      ...prev,
      jiraLinks: [...prev.jiraLinks, newLink]
    }));
  }, []);

  const removeJiraLink = useCallback((linkId: string) => {
    setState(prev => ({
      ...prev,
      jiraLinks: prev.jiraLinks.filter(jl => jl.id !== linkId)
    }));
  }, []);

  const rolloverOKR = useCallback((okrId: string) => {
    const okr = state.okrs.find(o => o.id === okrId);
    if (!okr) return;

    const [year, q] = okr.quarter.split('-');
    const qNum = parseInt(q.replace('Q', ''));
    let nextQuarter: string;
    let nextYear = parseInt(year);
    let nextQ: 'Q1' | 'Q2' | 'Q3' | 'Q4';
    
    if (qNum === 4) {
      nextQuarter = `${nextYear + 1}-Q1`;
      nextYear = nextYear + 1;
      nextQ = 'Q1';
    } else {
      nextQuarter = `${year}-Q${qNum + 1}`;
      nextQ = `Q${qNum + 1}` as 'Q1' | 'Q2' | 'Q3' | 'Q4';
    }

    const newOKR: OKR = {
      ...okr,
      id: `okr-${Date.now()}`,
      quarter: nextQuarter,
      year: nextYear,
      quarterNum: nextQ,
      isRolledOver: true,
      rolledOverFrom: okr.id
    };

    const newKRs = state.keyResults
      .filter(kr => kr.okrId === okrId)
      .map(kr => ({
        ...kr,
        id: `kr-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        okrId: newOKR.id,
        currentValue: kr.currentValue
      }));

    setState(prev => ({
      ...prev,
      okrs: [...prev.okrs, newOKR],
      keyResults: [...prev.keyResults, ...newKRs]
    }));
  }, [state.okrs, state.keyResults]);

  const createOKR = useCallback((data: CreateOKRData): string => {
    const [year, q] = data.quarter.split('-');
    const quarterNum = q as Quarter;
    
    const newOkrId = `okr-${Date.now()}`;
    
    const newOKR: OKR = {
      id: newOkrId,
      level: data.level,
      ownerId: data.ownerId,
      quarter: data.quarter,
      year: parseInt(year),
      quarterNum,
      objectiveText: data.objectiveText,
      parentOkrId: data.parentOkrId || undefined
    };

    const newKRs: KeyResult[] = data.keyResults
      .filter(kr => kr.metricName.trim())
      .map((kr, index) => ({
        id: `kr-${Date.now()}-${index}`,
        okrId: newOkrId,
        text: `${kr.metricName}${kr.baseline ? ` from ${kr.baseline}` : ''} to ${kr.target}`,
        targetValue: parseFloat(kr.target.replace(/[^0-9.]/g, '')) || 100,
        currentValue: kr.baseline ? parseFloat(kr.baseline.replace(/[^0-9.]/g, '')) || 0 : 0
      }));

    const initialCheckIn: CheckIn = {
      id: `ci-${Date.now()}`,
      okrId: newOkrId,
      date: new Date().toISOString().split('T')[0],
      cadence: 'biweekly',
      progress: 0,
      confidence: data.initialConfidence,
      confidenceLabel: getConfidenceLabel(data.initialConfidence),
      optionalNote: 'Initial confidence established at OKR creation.'
    };

    setState(prev => ({
      ...prev,
      okrs: [...prev.okrs, newOKR],
      keyResults: [...prev.keyResults, ...newKRs],
      checkIns: [...prev.checkIns, initialCheckIn]
    }));

    return newOkrId;
  }, []);

  const getOverallConfidence = useCallback((okrIds: string[]) => {
    const confidences = okrIds
      .map(id => {
        const latestCheckIn = state.checkIns
          .filter(ci => ci.okrId === id)
          .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];
        return latestCheckIn?.confidence;
      })
      .filter((c): c is number => c !== undefined);
    
    if (confidences.length === 0) return 0;
    return Math.round(confidences.reduce((a, b) => a + b, 0) / confidences.length);
  }, [state.checkIns]);

  const getAtRiskCount = useCallback((okrIds: string[]) => {
    return okrIds.filter(id => {
      const latestCheckIn = state.checkIns
        .filter(ci => ci.okrId === id)
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];
      return latestCheckIn && latestCheckIn.confidence < 40;
    }).length;
  }, [state.checkIns]);

  const getOnTrackCount = useCallback((okrIds: string[]) => {
    return okrIds.filter(id => {
      const latestCheckIn = state.checkIns
        .filter(ci => ci.okrId === id)
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];
      return latestCheckIn && latestCheckIn.confidence >= 40;
    }).length;
  }, [state.checkIns]);

  const value: AppContextType = {
    ...state,
    isDemoMode,
    setViewMode,
    setCurrentQuarter,
    setSelectedTeamId,
    refreshData,
    getOKRWithDetails,
    getOKRsByLevel,
    getOKRsByQuarter,
    getTeamOKRs,
    createOKR,
    addCheckIn,
    getTeam,
    updateTeamCadence,
    addOKRLink,
    addJiraLink,
    removeJiraLink,
    rolloverOKR,
    getOverallConfidence,
    getAtRiskCount,
    getOnTrackCount,
    isCurrentUserPM,
    canEditOKR
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}
