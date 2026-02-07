import { useState, useEffect, useCallback } from 'react';

const DEMO_MODE_KEY = 'truenorth_demo_mode';

export function useDemoMode() {
  const [isDemoMode, setIsDemoMode] = useState<boolean>(() => {
    // Check URL param first
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      if (urlParams.get('demo') === 'true') {
        localStorage.setItem(DEMO_MODE_KEY, 'true');
        return true;
      }
      // Then check localStorage
      return localStorage.getItem(DEMO_MODE_KEY) === 'true';
    }
    return false;
  });

  useEffect(() => {
    // Sync to localStorage when changed
    if (isDemoMode) {
      localStorage.setItem(DEMO_MODE_KEY, 'true');
    } else {
      localStorage.removeItem(DEMO_MODE_KEY);
    }
  }, [isDemoMode]);

  const enableDemoMode = useCallback(() => {
    setIsDemoMode(true);
    // Reload to apply demo data
    window.location.href = window.location.pathname;
  }, []);

  const disableDemoMode = useCallback(() => {
    setIsDemoMode(false);
    // Reload to clear demo data
    window.location.href = window.location.pathname;
  }, []);

  const toggleDemoMode = useCallback(() => {
    if (isDemoMode) {
      disableDemoMode();
    } else {
      enableDemoMode();
    }
  }, [isDemoMode, enableDemoMode, disableDemoMode]);

  return {
    isDemoMode,
    enableDemoMode,
    disableDemoMode,
    toggleDemoMode
  };
}

// Static check for use outside React
export function checkDemoMode(): boolean {
  if (typeof window === 'undefined') return false;
  
  const urlParams = new URLSearchParams(window.location.search);
  if (urlParams.get('demo') === 'true') return true;
  
  return localStorage.getItem(DEMO_MODE_KEY) === 'true';
}
