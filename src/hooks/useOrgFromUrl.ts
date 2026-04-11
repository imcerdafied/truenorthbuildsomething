import { useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';

/**
 * Reads the `?org=` query parameter on load.
 * TrueNorthOS is single-org — the user's org is tied to their profile.
 * If the incoming org ID matches the user's org, they're already in the right place.
 * Either way, clears the param from the URL.
 * Used when navigating from other BSPG tools via SharedNav.
 */
export function useOrgFromUrl() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { organization } = useAuth();

  useEffect(() => {
    const orgFromUrl = searchParams.get('org');
    if (orgFromUrl) {
      // Single-org app — user is already in their org.
      // If the IDs don't match, there's nothing to switch to.
      // Just clean the URL param.
      const next = new URLSearchParams(searchParams);
      next.delete('org');
      setSearchParams(next, { replace: true });
    }
  }, [organization]); // re-run once org is loaded in case of timing
}
