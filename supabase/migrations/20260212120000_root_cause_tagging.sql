-- ============================================
-- TrueNorthOS: Root Cause Tagging Migration
-- Run AFTER the main migration script
-- ============================================

-- Root cause categories
CREATE TYPE public.root_cause_category AS ENUM (
  'capacity',
  'dependency',
  'vendor',
  'compliance',
  'strategy_shift',
  'technical_debt',
  'data_quality',
  'scope_change'
);

-- Add optional root cause fields to check_ins
ALTER TABLE public.check_ins
  ADD COLUMN root_cause public.root_cause_category,
  ADD COLUMN root_cause_note text,
  ADD COLUMN recovery_likelihood text;

-- ============================================
-- DONE
-- ============================================
