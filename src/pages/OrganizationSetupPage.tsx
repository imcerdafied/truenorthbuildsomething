import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

function domainNameFromEmail(email: string): string {
  const part = email.split('@')[1] || '';
  const stripped = part.toLowerCase().replace(/\.(com|io|co|org|net)$/i, '');
  const base = stripped || 'workspace';
  return base.charAt(0).toUpperCase() + base.slice(1);
}

export function OrganizationSetupPage() {
  const { user, refreshProfile } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [isSettingUp, setIsSettingUp] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const hasRun = useRef(false);

  const runSetup = async () => {
    if (!user?.email) {
      setError('No user email');
      setIsSettingUp(false);
      return;
    }

    setIsSettingUp(true);
    setError(null);

    try {
      const domainName = domainNameFromEmail(user.email);

      const { data: org, error: orgError } = await supabase
        .from('organizations')
        .insert({ name: domainName, setup_complete: true })
        .select('id')
        .single();

      if (orgError || !org) {
        throw new Error(orgError?.message || 'Failed to create organization');
      }

      const { error: profileError } = await supabase
        .from('profiles')
        .update({ organization_id: org.id })
        .eq('id', user.id);

      if (profileError) {
        await supabase.from('organizations').delete().eq('id', org.id);
        throw new Error(profileError.message || 'Failed to update profile');
      }

      await supabase
        .from('user_roles')
        .insert({ user_id: user.id, role: 'admin' });

      const { data: paData, error: paError } = await supabase
        .from('product_areas')
        .insert({ name: 'General', organization_id: org.id })
        .select('id')
        .single();

      if (paError || !paData) {
        throw new Error(paError?.message || 'Failed to create product area');
      }

      const { data: domainData, error: domainError } = await supabase
        .from('domains')
        .insert({ name: 'General', product_area_id: paData.id })
        .select('id')
        .single();

      if (domainError || !domainData) {
        throw new Error(domainError?.message || 'Failed to create domain');
      }

      const { error: teamError } = await supabase
        .from('teams')
        .insert({ name: 'Team 1', domain_id: domainData.id });

      if (teamError) {
        throw new Error(teamError?.message || 'Failed to create team');
      }

      await refreshProfile();
      navigate('/first-outcome');
    } catch (err) {
      console.error('Setup error:', err);
      setError(err instanceof Error ? err.message : 'Failed to set up workspace.');
      setIsSettingUp(false);
      toast({
        title: 'Error',
        description: err instanceof Error ? err.message : 'Failed to create organization. Please try again.',
        variant: 'destructive',
      });
    }
  };

  useEffect(() => {
    if (!user || hasRun.current) return;
    hasRun.current = true;
    runSetup();
  }, [user?.id]);

  if (isSettingUp && !error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-background gap-4">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        <p className="text-sm text-muted-foreground">Setting up your workspace...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-background gap-4">
        <p className="text-sm text-destructive text-center max-w-sm">{error}</p>
        <Button onClick={runSetup} variant="outline">
          Try again
        </Button>
      </div>
    );
  }

  return null;
}
