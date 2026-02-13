import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { useApp } from '@/context/AppContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Loader2, Layers, Building2, Users, Plus, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

function domainNameFromEmail(email: string): string {
  const part = email.split('@')[1] || '';
  const stripped = part.toLowerCase().replace(/\.(com|io|co|org|net)$/i, '');
  const base = stripped || 'workspace';
  return base.charAt(0).toUpperCase() + base.slice(1);
}

// Draft structure for step 2 (no ids until we insert)
interface DraftTeam {
  name: string;
}
interface DraftDomain {
  name: string;
  teams: DraftTeam[];
}
interface DraftProductArea {
  name: string;
  domains: DraftDomain[];
}

const INITIAL_STRUCTURE: DraftProductArea[] = [
  {
    name: '',
    domains: [
      { name: '', teams: [{ name: '' }] },
    ],
  },
];

type CadenceOption = 'weekly' | 'biweekly';

export function OrganizationSetupPage() {
  const { user, organization, refreshProfile } = useAuth();
  const { setViewMode } = useApp();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [step, setStep] = useState(1);
  const [orgName, setOrgName] = useState('');
  const [orgId, setOrgId] = useState<string | null>(null);
  const [structure, setStructure] = useState<DraftProductArea[]>(INITIAL_STRUCTURE);
  const [createdTeamIds, setCreatedTeamIds] = useState<string[]>([]);
  const [cadence, setCadence] = useState<CadenceOption>('biweekly');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // If user already has an org, skip to home
  useEffect(() => {
    if (organization?.id) {
      navigate('/', { replace: true });
    }
  }, [organization?.id, navigate]);

  // Pre-fill org name from email when user is available
  useEffect(() => {
    if (user?.email && !orgName) {
      setOrgName(domainNameFromEmail(user.email));
    }
  }, [user?.email, orgName]);

  // Step 1: create org, update profile, add user_role
  const handleStep1Continue = async () => {
    if (!user?.id || !user?.email || !orgName.trim()) {
      setError('Please enter an organization name.');
      return;
    }
    setError(null);
    setIsSubmitting(true);
    try {
      const { data: org, error: orgError } = await supabase
        .from('organizations')
        .insert({ name: orgName.trim(), setup_complete: false })
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

      const { data: existingRole } = await supabase
        .from('user_roles')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();
      if (!existingRole) {
        await supabase
          .from('user_roles')
          .insert({ user_id: user.id, role: 'admin' });
      }

      setOrgId(org.id);
      setStep(2);
    } catch (err) {
      console.error('Step 1 error:', err);
      setError(err instanceof Error ? err.message : 'Something went wrong.');
      toast({
        title: 'Error',
        description: err instanceof Error ? err.message : 'Failed to create organization.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Step 2: permissive — ensure at least one PA; auto-create default domain/team when blank
  const handleStep2Continue = async () => {
    if (!orgId || structure.length === 0) {
      setError('Add at least one product area.');
      return;
    }
    setError(null);
    setIsSubmitting(true);
    const teamIds: string[] = [];
    try {
      for (const pa of structure) {
        const paName = pa.name.trim() || 'General';
        const { data: paData, error: paError } = await supabase
          .from('product_areas')
          .insert({ name: paName, organization_id: orgId })
          .select('id')
          .single();
        if (paError || !paData) throw new Error(paError?.message || 'Failed to create product area');

        const domainsToCreate =
          pa.domains.length > 0
            ? pa.domains
            : [{ name: '', teams: [] as DraftTeam[] }];

        for (const dom of domainsToCreate) {
          const domName = dom.name.trim() || paName;
          const { data: domData, error: domError } = await supabase
            .from('domains')
            .insert({ name: domName, product_area_id: paData.id })
            .select('id')
            .single();
          if (domError || !domData) throw new Error(domError?.message || 'Failed to create domain');

          const teamsToCreate =
            dom.teams.length > 0 ? dom.teams : [{ name: 'Team 1' }];
          for (const team of teamsToCreate) {
            const teamName = team.name.trim() || 'Team 1';
            const { data: teamData, error: teamError } = await supabase
              .from('teams')
              .insert({
                name: teamName,
                domain_id: domData.id,
                cadence: 'biweekly',
              })
              .select('id')
              .single();
            if (teamError || !teamData) throw new Error(teamError?.message || 'Failed to create team');
            teamIds.push(teamData.id);
          }
        }
      }
      setCreatedTeamIds(teamIds);
      setStep(3);
    } catch (err) {
      console.error('Step 2 error:', err);
      setError(err instanceof Error ? err.message : 'Something went wrong.');
      toast({
        title: 'Error',
        description: err instanceof Error ? err.message : 'Failed to create structure.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Step 3: set cadence on all teams, mark setup complete, redirect
  const handleStep3Finish = async () => {
    if (!orgId) return;
    setIsSubmitting(true);
    setError(null);
    try {
      for (const teamId of createdTeamIds) {
        const { error: updError } = await supabase
          .from('teams')
          .update({ cadence })
          .eq('id', teamId);
        if (updError) throw new Error(updError.message || 'Failed to update cadence');
      }
      await supabase
        .from('organizations')
        .update({ setup_complete: true })
        .eq('id', orgId);
      await refreshProfile();
      setViewMode('exec');
      navigate('/');
    } catch (err) {
      console.error('Step 3 error:', err);
      setError(err instanceof Error ? err.message : 'Something went wrong.');
      toast({
        title: 'Error',
        description: err instanceof Error ? err.message : 'Failed to save cadence.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Structure editors (draft only, no DB until Continue)
  const addProductArea = () => {
    setStructure((prev) => [
      ...prev,
      { name: '', domains: [{ name: '', teams: [{ name: '' }] }] },
    ]);
  };
  const updateProductArea = (paIndex: number, name: string) => {
    setStructure((prev) =>
      prev.map((pa, i) => (i === paIndex ? { ...pa, name } : pa))
    );
  };
  const removeProductArea = (paIndex: number) => {
    if (structure.length <= 1) return;
    setStructure((prev) => prev.filter((_, i) => i !== paIndex));
  };
  const addDomain = (paIndex: number) => {
    setStructure((prev) =>
      prev.map((pa, i) =>
        i === paIndex
          ? { ...pa, domains: [...pa.domains, { name: '', teams: [{ name: '' }] }] }
          : pa
      )
    );
  };
  const updateDomain = (paIndex: number, domIndex: number, name: string) => {
    setStructure((prev) =>
      prev.map((pa, i) =>
        i === paIndex
          ? {
              ...pa,
              domains: pa.domains.map((d, j) => (j === domIndex ? { ...d, name } : d)),
            }
          : pa
      )
    );
  };
  const removeDomain = (paIndex: number, domIndex: number) => {
    setStructure((prev) =>
      prev.map((pa, i) =>
        i === paIndex
          ? { ...pa, domains: pa.domains.filter((_, j) => j !== domIndex) }
          : pa
      )
    );
  };
  const addTeam = (paIndex: number, domIndex: number) => {
    setStructure((prev) =>
      prev.map((pa, i) =>
        i === paIndex
          ? {
              ...pa,
              domains: pa.domains.map((d, j) =>
                j === domIndex ? { ...d, teams: [...d.teams, { name: '' }] } : d
              ),
            }
          : pa
      )
    );
  };
  const updateTeam = (paIndex: number, domIndex: number, teamIndex: number, name: string) => {
    setStructure((prev) =>
      prev.map((pa, i) =>
        i === paIndex
          ? {
              ...pa,
              domains: pa.domains.map((d, j) =>
                j === domIndex
                  ? {
                      ...d,
                      teams: d.teams.map((t, k) => (k === teamIndex ? { ...t, name } : t)),
                    }
                  : d
              ),
            }
          : pa
      )
    );
  };
  const removeTeam = (paIndex: number, domIndex: number, teamIndex: number) => {
    setStructure((prev) =>
      prev.map((pa, i) =>
        i === paIndex
          ? {
              ...pa,
              domains: pa.domains.map((d, j) =>
                j === domIndex
                  ? { ...d, teams: d.teams.filter((_, k) => k !== teamIndex) }
                  : d
              ),
            }
          : pa
      )
    );
  };

  if (!user) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        <p className="text-sm text-muted-foreground mt-4">Loading...</p>
      </div>
    );
  }

  const maxW = 'max-w-lg';
  const stepIndicator = (
    <div className="flex gap-2 mb-6">
      {[1, 2, 3].map((s) => (
        <div
          key={s}
          className={cn(
            'w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium',
            step === s
              ? 'bg-primary text-primary-foreground'
              : step > s
                ? 'bg-primary/20 text-primary'
                : 'bg-muted text-muted-foreground'
          )}
        >
          {s}
        </div>
      ))}
    </div>
  );

  return (
    <div className="min-h-screen flex flex-col items-center p-6 bg-background">
      <div className={cn('w-full', maxW)}>
        {stepIndicator}

        {/* Step 1: Name your organization */}
        {step === 1 && (
          <Card>
            <CardHeader>
              <CardTitle>Name your organization</CardTitle>
              <CardDescription>
                You can change this later in Organization Setup.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Organization name</label>
                <Input
                  value={orgName}
                  onChange={(e) => setOrgName(e.target.value)}
                  placeholder="e.g. Acme"
                  className="max-w-sm"
                />
              </div>
              {error && <p className="text-sm text-destructive">{error}</p>}
              <Button onClick={handleStep1Continue} disabled={isSubmitting} className="gap-2">
                {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
                Continue
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Step 2: Confirm your starting structure */}
        {step === 2 && (
          <Card>
            <CardHeader>
              <CardTitle>Confirm your starting structure</CardTitle>
              <CardDescription>
                This is a lightweight starting point so outcomes roll up correctly. You can refine this anytime.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                {structure.map((pa, paIndex) => (
                  <div key={paIndex} className="bg-white dark:bg-card border border-border rounded-lg p-4">
                    <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground mb-2">
                      Product Area
                    </p>
                    <div className="flex items-center gap-2">
                      <Input
                        value={pa.name}
                        onChange={(e) => updateProductArea(paIndex, e.target.value)}
                        placeholder="e.g. Booking, Growth, Loyalty"
                        className="h-8 flex-1"
                      />
                      {structure.length > 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 shrink-0"
                          onClick={() => removeProductArea(paIndex)}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      )}
                    </div>

                    <div className="ml-6 mt-4 border-l-2 border-muted pl-4 space-y-4">
                      {pa.domains.map((dom, domIndex) => (
                        <div key={domIndex} className="space-y-2">
                          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                            {pa.name.trim() ? `Domain in ${pa.name.trim()}` : 'Domain'}
                          </p>
                          <div className="flex items-center gap-2">
                            <Input
                              value={dom.name}
                              onChange={(e) => updateDomain(paIndex, domIndex, e.target.value)}
                              placeholder="e.g. Search, Checkout, Payments"
                              className="h-7 text-sm flex-1"
                            />
                            {pa.domains.length > 1 && (
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6 shrink-0"
                                onClick={() => removeDomain(paIndex, domIndex)}
                              >
                                <X className="w-3 h-3" />
                              </Button>
                            )}
                          </div>

                          <div className="ml-6 mt-3 border-l-2 border-muted/50 pl-4 space-y-3">
                            {dom.teams.map((team, teamIndex) => (
                              <div key={teamIndex} className="space-y-1">
                                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                                  {dom.name.trim() ? `Team in ${dom.name.trim()}` : 'Team'}
                                </p>
                                <div className="flex items-center gap-2">
                                  <Input
                                    value={team.name}
                                    onChange={(e) =>
                                      updateTeam(paIndex, domIndex, teamIndex, e.target.value)
                                    }
                                    placeholder="e.g. The Butlers, The Maids, The Belldesk"
                                    className="h-7 text-sm flex-1"
                                  />
                                  {dom.teams.length > 1 && (
                                    <Button
                                      type="button"
                                      variant="ghost"
                                      size="icon"
                                      className="h-6 w-6 shrink-0"
                                      onClick={() => removeTeam(paIndex, domIndex, teamIndex)}
                                    >
                                      <X className="w-3 h-3" />
                                    </Button>
                                  )}
                                </div>
                                <p className="text-xs text-muted-foreground">
                                  Rename to match a real team (e.g. &quot;Search Team&quot;).
                                </p>
                              </div>
                            ))}
                            <button
                              type="button"
                              onClick={() => addTeam(paIndex, domIndex)}
                              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                            >
                              + Add team{dom.name.trim() ? ` to ${dom.name.trim()}` : ''}
                            </button>
                          </div>
                        </div>
                      ))}
                      <button
                        type="button"
                        onClick={() => addDomain(paIndex)}
                        className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                      >
                        + Add domain{pa.name.trim() ? ` to ${pa.name.trim()}` : ''}
                      </button>
                    </div>
                  </div>
                ))}

                <Button
                  type="button"
                  variant="ghost"
                  className="text-sm font-medium"
                  onClick={addProductArea}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add product area
                </Button>
              </div>

              <p className="text-xs text-muted-foreground/50 italic">
                Product Areas are broad outcome groups. Domains are major capability areas. Teams are the groups that own outcomes.
              </p>

              {error && <p className="text-sm text-destructive">{error}</p>}
              <div className="flex justify-end">
                <Button
                  onClick={handleStep2Continue}
                  disabled={isSubmitting}
                  className="gap-2"
                >
                  {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
                  Looks good — continue
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 3: Set check-in cadence */}
        {step === 3 && (
          <Card>
            <CardHeader>
              <CardTitle>Set check-in cadence</CardTitle>
              <CardDescription>
                How often should teams update confidence on their outcomes?
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Default cadence</label>
                <Select value={cadence} onValueChange={(v) => setCadence(v as CadenceOption)}>
                  <SelectTrigger className="max-w-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="weekly">Weekly</SelectItem>
                    <SelectItem value="biweekly">Bi-weekly</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {error && <p className="text-sm text-destructive">{error}</p>}
              <div className="flex justify-end">
                <Button onClick={handleStep3Finish} disabled={isSubmitting} className="gap-2">
                  {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
                  Complete setup
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
