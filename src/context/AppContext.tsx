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
  ConfidenceLabel,
  getConfidenceLabel,
  getTrend,
  getCurrentQuarter
} from '@/types';
import { toast } from '@/hooks/use-toast';

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
  createOKR: (data: CreateOKRData) => Promise<string>;
  
  // Check-in operations
  addCheckIn: (checkIn: Omit<CheckIn, 'id' | 'confidenceLabel'>) => Promise<void>;
  
  // Team operations
  getTeam: (teamId: string) => Team | undefined;
  updateTeamCadence: (teamId: string, cadence: 'weekly' | 'biweekly') => Promise<void>;
  
  // Linking operations
  addOKRLink: (parentOkrId: string, childOkrId: string) => Promise<void>;
  addJiraLink: (okrId: string, epicIdentifierOrUrl: string) => Promise<void>;
  removeJiraLink: (linkId: string) => Promise<void>;
  
  // Rollover operations
  rolloverOKR: (okrId: string) => Promise<void>;
  
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
  const { organization, profile, user } = useAuth();
  const isDemoMode = checkDemoMode();
  
  const [state, setState] = useState<AppState>(() => {
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

  // ── Fetch ALL data from Supabase ──────────────────────────────────────
  const refreshData = useCallback(async () => {
    if (isDemoMode) return;
    
    if (!organization?.id) {
      setState(prev => ({ ...prev, isLoading: false }));
      return;
    }

    try {
      // Fetch org structure
      const { data: paData } = await supabase
        .from('product_areas')
        .select('*')
        .eq('organization_id', organization.id)
        .order('name');

      const productAreas: ProductArea[] = (paData || []).map(pa => ({
        id: pa.id,
        name: pa.name
      }));

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

      // Fetch OKRs for this organization
      const { data: okrData, error: okrError } = await supabase
        .from('okrs')
        .select('*')
        .eq('organization_id', organization.id)
        .order('created_at', { ascending: false });

      if (okrError) console.error('Error fetching OKRs:', okrError);

      const okrs: OKR[] = (okrData || []).map(o => ({
        id: o.id,
        level: o.level as OKRLevel,
        ownerId: o.owner_id,
        quarter: o.quarter,
        year: o.year,
        quarterNum: o.quarter_num as Quarter,
        objectiveText: o.objective_text,
        parentOkrId: o.parent_okr_id || undefined,
        isRolledOver: o.is_rolled_over,
        rolledOverFrom: o.rolled_over_from || undefined
      }));

      const okrIds = okrs.map(o => o.id);

      // Only fetch child data if we have OKRs
      let keyResults: KeyResult[] = [];
      let checkIns: CheckIn[] = [];
      let jiraLinks: JiraLink[] = [];

      if (okrIds.length > 0) {
        const { data: krData, error: krError } = await supabase
          .from('key_results')
          .select('*')
          .in('okr_id', okrIds);

        if (krError) console.error('Error fetching key results:', krError);

        keyResults = (krData || []).map(kr => ({
          id: kr.id,
          okrId: kr.okr_id,
          text: kr.text,
          targetValue: Number(kr.target_value),
          currentValue: Number(kr.current_value),
          needsAttention: kr.needs_attention,
          attentionReason: kr.attention_reason || undefined
        }));

        const { data: ciData, error: ciError } = await supabase
          .from('check_ins')
          .select('*')
          .in('okr_id', okrIds)
          .order('date', { ascending: false });

        if (ciError) console.error('Error fetching check-ins:', ciError);

        checkIns = (ciData || []).map(ci => ({
          id: ci.id,
          okrId: ci.okr_id,
          date: ci.date,
          cadence: ci.cadence as Cadence,
          progress: ci.progress,
          confidence: ci.confidence,
          confidenceLabel: ci.confidence_label as CheckIn['confidenceLabel'],
          reasonForChange: ci.reason_for_change || undefined,
          optionalNote: ci.optional_note || undefined
        }));

        const { data: jlData, error: jiraError } = await supabase
          .from('jira_links')
          .select('*')
          .in('okr_id', okrIds);

        if (jiraError) console.error('Error fetching jira links:', jiraError);

        jiraLinks = (jlData || []).map(jl => ({
          id: jl.id,
          okrId: jl.okr_id,
          epicIdentifierOrUrl: jl.epic_identifier_or_url
        }));
      }

      const firstTeamId = teams.length > 0 ? teams[0].id : '';

      setState(prev => ({
        ...prev,
        productAreas,
        domains,
        teams,
        okrs,
        keyResults,
        checkIns,
        jiraLinks,
        selectedTeamId: prev.selectedTeamId || firstTeamId,
        currentPM: profile?.full_name || '',
        isLoading: false,
        isDemoMode: false
      }));
    } catch (error) {
      console.error('Error fetching organization data:', error);
      setState(prev => ({ ...prev, isLoading: false }));
      toast({
        title: 'Failed to load data',
        description: error instanceof Error ? error.message : 'Please try again.',
        variant: 'destructive',
      });
    }
  }, [organization?.id, profile?.full_name, isDemoMode]);

  useEffect(() => {
    refreshData();
  }, [refreshData]);

  // ── Simple setters ────────────────────────────────────────────────────

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

  // ── Read helpers (computed from local state) ──────────────────────────

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

  // ── Mutations (write to Supabase, then refresh) ───────────────────────

  const createOKR = useCallback(async (data: CreateOKRData): Promise<string> => {
    // Demo mode: in-memory only
    if (isDemoMode) {
      const [year, q] = data.quarter.split('-');
      const newOkrId = `okr-${Date.now()}`;
      const newOKR: OKR = {
        id: newOkrId,
        level: data.level,
        ownerId: data.ownerId,
        quarter: data.quarter,
        year: parseInt(year),
        quarterNum: q as Quarter,
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
        optionalNote: 'Initial confidence established.'
      };
      setState(prev => ({
        ...prev,
        okrs: [...prev.okrs, newOKR],
        keyResults: [...prev.keyResults, ...newKRs],
        checkIns: [...prev.checkIns, initialCheckIn]
      }));
      toast({ title: 'OKR created' });
      return newOkrId;
    }

    // Real mode: persist to Supabase
    if (!organization?.id) throw new Error('No organization found');

    const [year, q] = data.quarter.split('-');
    const quarterNum = q as Quarter;

    const { data: okrRow, error: okrError } = await supabase
      .from('okrs')
      .insert({
        organization_id: organization.id,
        level: data.level,
        owner_id: data.ownerId,
        quarter: data.quarter,
        year: parseInt(year),
        quarter_num: quarterNum,
        objective_text: data.objectiveText,
        parent_okr_id: data.parentOkrId || null,
        created_by: user?.id || null,
      })
      .select('id')
      .single();

    if (okrError || !okrRow) {
      console.error('Error creating OKR:', okrError);
      toast({
        title: 'Failed to create OKR',
        description: okrError?.message || 'Please try again.',
        variant: 'destructive',
      });
      throw new Error(okrError?.message || 'Failed to create OKR');
    }

    const newOkrId = okrRow.id;

    // Insert key results
    const krInserts = data.keyResults
      .filter(kr => kr.metricName.trim())
      .map(kr => ({
        okr_id: newOkrId,
        text: `${kr.metricName}${kr.baseline ? ` from ${kr.baseline}` : ''} to ${kr.target}`,
        target_value: parseFloat(kr.target.replace(/[^0-9.]/g, '')) || 100,
        current_value: kr.baseline ? parseFloat(kr.baseline.replace(/[^0-9.]/g, '')) || 0 : 0
      }));

    if (krInserts.length > 0) {
      const { error: krError } = await supabase
        .from('key_results')
        .insert(krInserts);
      if (krError) console.error('Error creating key results:', krError);
    }

    // Insert initial check-in
    const { error: ciError } = await supabase
      .from('check_ins')
      .insert({
        okr_id: newOkrId,
        date: new Date().toISOString().split('T')[0],
        cadence: 'biweekly',
        progress: 0,
        confidence: data.initialConfidence,
        confidence_label: getConfidenceLabel(data.initialConfidence),
        optional_note: 'Initial confidence established.',
        created_by: user?.id || null
      });
    if (ciError) console.error('Error creating initial check-in:', ciError);

    await refreshData();
    toast({ title: 'OKR created' });
    return newOkrId;
  }, [isDemoMode, organization?.id, user?.id, refreshData]);

  const addCheckIn = useCallback(async (checkIn: Omit<CheckIn, 'id' | 'confidenceLabel'>): Promise<void> => {
    const confidenceLabel = getConfidenceLabel(checkIn.confidence);

    if (isDemoMode) {
      const newCheckIn: CheckIn = {
        ...checkIn,
        id: `ci-${Date.now()}`,
        confidenceLabel,
      };
      setState(prev => ({
        ...prev,
        checkIns: [...prev.checkIns, newCheckIn]
      }));
      toast({ title: 'Check-in saved' });
      return;
    }

    const { error } = await supabase
      .from('check_ins')
      .insert({
        okr_id: checkIn.okrId,
        date: checkIn.date,
        cadence: checkIn.cadence,
        progress: checkIn.progress,
        confidence: checkIn.confidence,
        confidence_label: confidenceLabel,
        reason_for_change: checkIn.reasonForChange || null,
        optional_note: checkIn.optionalNote || null,
        created_by: user?.id || null,
      });

    if (error) {
      console.error('Error saving check-in:', error);
      toast({
        title: 'Failed to save check-in',
        description: error.message || 'Please try again.',
        variant: 'destructive',
      });
      throw new Error(error.message);
    }

    await refreshData();
    toast({ title: 'Check-in saved' });
  }, [isDemoMode, user?.id, refreshData]);

  const updateTeamCadence = useCallback(async (teamId: string, cadence: 'weekly' | 'biweekly') => {
    if (isDemoMode) {
      setState(prev => ({
        ...prev,
        teams: prev.teams.map(t => t.id === teamId ? { ...t, cadence } : t)
      }));
      toast({ title: 'Cadence updated' });
      return;
    }

    const { error } = await supabase
      .from('teams')
      .update({ cadence })
      .eq('id', teamId);

    if (error) {
      console.error('Error updating team cadence:', error);
      toast({
        title: 'Failed to update cadence',
        description: error.message || 'Please try again.',
        variant: 'destructive',
      });
      throw error;
    }

    await refreshData();
    toast({ title: 'Cadence updated' });
  }, [isDemoMode, refreshData]);

  const addOKRLink = useCallback(async (parentOkrId: string, childOkrId: string) => {
    if (isDemoMode) {
      setState(prev => ({
        ...prev,
        okrs: prev.okrs.map(o => o.id === childOkrId ? { ...o, parentOkrId } : o)
      }));
      toast({ title: 'OKR linked' });
      return;
    }

    // Update the child OKR's parent_okr_id
    const { error: okrError } = await supabase
      .from('okrs')
      .update({ parent_okr_id: parentOkrId })
      .eq('id', childOkrId);

    if (okrError) {
      console.error('Error linking OKR:', okrError);
      toast({
        title: 'Failed to link OKR',
        description: okrError.message || 'Please try again.',
        variant: 'destructive',
      });
      throw okrError;
    }

    // Also create an entry in okr_links for explicit tracking
    const { error: linkError } = await supabase
      .from('okr_links')
      .insert({
        parent_okr_id: parentOkrId,
        child_okr_id: childOkrId
      });

    if (linkError) console.error('Error creating okr_link:', linkError);

    await refreshData();
    toast({ title: 'OKR linked' });
  }, [isDemoMode, refreshData]);

  const addJiraLink = useCallback(async (okrId: string, epicIdentifierOrUrl: string) => {
    if (isDemoMode) {
      const newLink: JiraLink = {
        id: `jl-${Date.now()}`,
        okrId,
        epicIdentifierOrUrl
      };
      setState(prev => ({
        ...prev,
        jiraLinks: [...prev.jiraLinks, newLink]
      }));
      toast({ title: 'Jira link added' });
      return;
    }

    const { error } = await supabase
      .from('jira_links')
      .insert({
        okr_id: okrId,
        epic_identifier_or_url: epicIdentifierOrUrl
      });

    if (error) {
      console.error('Error adding Jira link:', error);
      toast({
        title: 'Failed to add Jira link',
        description: error.message || 'Please try again.',
        variant: 'destructive',
      });
      throw error;
    }

    await refreshData();
    toast({ title: 'Jira link added' });
  }, [isDemoMode, refreshData]);

  const removeJiraLink = useCallback(async (linkId: string) => {
    if (isDemoMode) {
      setState(prev => ({
        ...prev,
        jiraLinks: prev.jiraLinks.filter(jl => jl.id !== linkId)
      }));
      toast({ title: 'Jira link removed' });
      return;
    }

    const { error } = await supabase
      .from('jira_links')
      .delete()
      .eq('id', linkId);

    if (error) {
      console.error('Error removing Jira link:', error);
      toast({
        title: 'Failed to remove Jira link',
        description: error.message || 'Please try again.',
        variant: 'destructive',
      });
      throw error;
    }

    await refreshData();
    toast({ title: 'Jira link removed' });
  }, [isDemoMode, refreshData]);

  const rolloverOKR = useCallback(async (okrId: string) => {
    const okr = state.okrs.find(o => o.id === okrId);
    if (!okr) return;

    const [year, q] = okr.quarter.split('-');
    const qNum = parseInt(q.replace('Q', ''));
    let nextQuarter: string;
    let nextYear = parseInt(year);
    let nextQ: Quarter;
    
    if (qNum === 4) {
      nextQuarter = `${nextYear + 1}-Q1`;
      nextYear = nextYear + 1;
      nextQ = 'Q1';
    } else {
      nextQuarter = `${year}-Q${qNum + 1}`;
      nextQ = `Q${qNum + 1}` as Quarter;
    }

    if (isDemoMode) {
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
      toast({ title: 'OKR rolled over' });
      return;
    }

    // Real mode: insert new OKR into Supabase
    const { data: newOkrRow, error: okrError } = await supabase
      .from('okrs')
      .insert({
        organization_id: organization!.id,
        level: okr.level,
        owner_id: okr.ownerId,
        quarter: nextQuarter,
        year: nextYear,
        quarter_num: nextQ,
        objective_text: okr.objectiveText,
        parent_okr_id: okr.parentOkrId || null,
        is_rolled_over: true,
        rolled_over_from: okr.id,
        created_by: user?.id || null
      })
      .select()
      .single();

    if (okrError) {
      console.error('Error rolling over OKR:', okrError);
      toast({
        title: 'Failed to roll over OKR',
        description: okrError.message || 'Please try again.',
        variant: 'destructive',
      });
      throw okrError;
    }

    // Copy key results to new OKR
    const existingKRs = state.keyResults.filter(kr => kr.okrId === okrId);
    if (existingKRs.length > 0) {
      const krInserts = existingKRs.map(kr => ({
        okr_id: newOkrRow.id,
        text: kr.text,
        target_value: kr.targetValue,
        current_value: kr.currentValue
      }));
      const { error: krError } = await supabase
        .from('key_results')
        .insert(krInserts);
      if (krError) console.error('Error copying key results:', krError);
    }

    await refreshData();
    toast({ title: 'OKR rolled over' });
  }, [state.okrs, state.keyResults, isDemoMode, organization, user, refreshData]);

  // ── Aggregations (pure computation from state) ────────────────────────

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

  // ── Context value ─────────────────────────────────────────────────────

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
