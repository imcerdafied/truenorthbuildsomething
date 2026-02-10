import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
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
    name: 'General',
    domains: [
      {
        name: 'General',
        teams: [{ name: 'Team 1' }],
      },
    ],
  },
];

type CadenceOption = 'weekly' | 'biweekly';

export function OrganizationSetupPage() {
  const { user, organization, refreshProfile } = useAuth();
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

  // If user already has an org, skip to first-outcome
  useEffect(() => {
    if (organization?.id) {
      navigate('/first-outcome', { replace: true });
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

      await supabase
        .from('user_roles')
        .insert({ user_id: user.id, role: 'admin' });

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

  // Step 2: validate min 1 PA with 1 domain with 1 team, then insert all
  const isValidStructure = (): boolean => {
    const hasValidPA = structure.some(
      (pa) => pa.domains.length > 0 && pa.domains.some((d) => d.teams.length > 0)
    );
    return hasValidPA;
  };

  const handleStep2Continue = async () => {
    if (!orgId || !isValidStructure()) {
      setError('Add at least one product area with one domain and one team.');
      return;
    }
    setError(null);
    setIsSubmitting(true);
    const teamIds: string[] = [];
    try {
      for (const pa of structure) {
        const { data: paData, error: paError } = await supabase
          .from('product_areas')
          .insert({ name: pa.name.trim() || 'General', organization_id: orgId })
          .select('id')
          .single();
        if (paError || !paData) throw new Error(paError?.message || 'Failed to create product area');

        for (const dom of pa.domains) {
          const { data: domData, error: domError } = await supabase
            .from('domains')
            .insert({ name: dom.name.trim() || 'General', product_area_id: paData.id })
            .select('id')
            .single();
          if (domError || !domData) throw new Error(domError?.message || 'Failed to create domain');

          for (const team of dom.teams) {
            const { data: teamData, error: teamError } = await supabase
              .from('teams')
              .insert({
                name: team.name.trim() || 'Team',
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
      navigate('/first-outcome');
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
      { name: 'New Product Area', domains: [{ name: 'General', teams: [{ name: 'Team 1' }] }] },
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
          ? { ...pa, domains: [...pa.domains, { name: 'New Domain', teams: [{ name: 'New Team' }] }] }
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
                j === domIndex ? { ...d, teams: [...d.teams, { name: 'New Team' }] } : d
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

        {/* Step 2: Define your structure */}
        {step === 2 && (
          <Card>
            <CardHeader>
              <CardTitle>Define your structure</CardTitle>
              <CardDescription>
                You can add and refine this later. Start with what&apos;s true today.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                {structure.map((pa, paIndex) => (
                  <div key={paIndex} className="border rounded-lg p-4 space-y-3">
                    <div className="flex items-center gap-2">
                      <Layers className="w-4 h-4 text-muted-foreground" />
                      <Input
                        value={pa.name}
                        onChange={(e) => updateProductArea(paIndex, e.target.value)}
                        placeholder="Product area name"
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
                    <div className="ml-6 space-y-3">
                      {pa.domains.map((dom, domIndex) => (
                        <div key={domIndex} className="border-l-2 border-border pl-4 space-y-2">
                          <div className="flex items-center gap-2">
                            <Building2 className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                            <Input
                              value={dom.name}
                              onChange={(e) => updateDomain(paIndex, domIndex, e.target.value)}
                              placeholder="Domain name"
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
                          <div className="ml-4 space-y-1.5">
                            {dom.teams.map((team, teamIndex) => (
                              <div key={teamIndex} className="flex items-center gap-2">
                                <Users className="w-3 h-3 text-muted-foreground shrink-0" />
                                <Input
                                  value={team.name}
                                  onChange={(e) =>
                                    updateTeam(paIndex, domIndex, teamIndex, e.target.value)
                                  }
                                  placeholder="Team name"
                                  className="h-6 text-xs flex-1"
                                />
                                {dom.teams.length > 1 && (
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    className="h-5 w-5 shrink-0"
                                    onClick={() => removeTeam(paIndex, domIndex, teamIndex)}
                                  >
                                    <X className="w-2.5 h-2.5" />
                                  </Button>
                                )}
                              </div>
                            ))}
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="text-xs h-6"
                              onClick={() => addTeam(paIndex, domIndex)}
                            >
                              <Plus className="w-3 h-3 mr-1" />
                              Add team
                            </Button>
                          </div>
                        </div>
                      ))}
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="text-xs"
                        onClick={() => addDomain(paIndex)}
                      >
                        <Plus className="w-3 h-3 mr-1" />
                        Add domain
                      </Button>
                    </div>
                  </div>
                ))}
                <Button type="button" variant="outline" size="sm" onClick={addProductArea}>
                  <Plus className="w-4 h-4 mr-2" />
                  Add product area
                </Button>
              </div>
              {error && <p className="text-sm text-destructive">{error}</p>}
              <Button
                onClick={handleStep2Continue}
                disabled={isSubmitting || !isValidStructure()}
                className="gap-2"
              >
                {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
                Continue
              </Button>
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
              <Button onClick={handleStep3Finish} disabled={isSubmitting} className="gap-2">
                {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
                Complete setup
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
