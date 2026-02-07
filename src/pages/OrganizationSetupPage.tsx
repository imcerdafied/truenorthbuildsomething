import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Target, Plus, X, Loader2, Building2, Layers, Users } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface ProductAreaInput {
  id: string;
  name: string;
  domains: DomainInput[];
}

interface DomainInput {
  id: string;
  name: string;
  teams: TeamInput[];
}

interface TeamInput {
  id: string;
  name: string;
  pmName: string;
}

const generateId = () => Math.random().toString(36).substring(2, 9);

export function OrganizationSetupPage() {
  const { user, refreshProfile } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [orgName, setOrgName] = useState('');
  const [productAreas, setProductAreas] = useState<ProductAreaInput[]>([
    {
      id: generateId(),
      name: '',
      domains: [
        {
          id: generateId(),
          name: '',
          teams: [{ id: generateId(), name: '', pmName: '' }],
        },
      ],
    },
  ]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [step, setStep] = useState(1);

  const addProductArea = () => {
    setProductAreas([
      ...productAreas,
      {
        id: generateId(),
        name: '',
        domains: [
          {
            id: generateId(),
            name: '',
            teams: [{ id: generateId(), name: '', pmName: '' }],
          },
        ],
      },
    ]);
  };

  const removeProductArea = (paId: string) => {
    if (productAreas.length > 1) {
      setProductAreas(productAreas.filter((pa) => pa.id !== paId));
    }
  };

  const updateProductArea = (paId: string, name: string) => {
    setProductAreas(
      productAreas.map((pa) => (pa.id === paId ? { ...pa, name } : pa))
    );
  };

  const addDomain = (paId: string) => {
    setProductAreas(
      productAreas.map((pa) =>
        pa.id === paId
          ? {
              ...pa,
              domains: [
                ...pa.domains,
                {
                  id: generateId(),
                  name: '',
                  teams: [{ id: generateId(), name: '', pmName: '' }],
                },
              ],
            }
          : pa
      )
    );
  };

  const removeDomain = (paId: string, domainId: string) => {
    setProductAreas(
      productAreas.map((pa) =>
        pa.id === paId
          ? {
              ...pa,
              domains:
                pa.domains.length > 1
                  ? pa.domains.filter((d) => d.id !== domainId)
                  : pa.domains,
            }
          : pa
      )
    );
  };

  const updateDomain = (paId: string, domainId: string, name: string) => {
    setProductAreas(
      productAreas.map((pa) =>
        pa.id === paId
          ? {
              ...pa,
              domains: pa.domains.map((d) =>
                d.id === domainId ? { ...d, name } : d
              ),
            }
          : pa
      )
    );
  };

  const addTeam = (paId: string, domainId: string) => {
    setProductAreas(
      productAreas.map((pa) =>
        pa.id === paId
          ? {
              ...pa,
              domains: pa.domains.map((d) =>
                d.id === domainId
                  ? {
                      ...d,
                      teams: [...d.teams, { id: generateId(), name: '', pmName: '' }],
                    }
                  : d
              ),
            }
          : pa
      )
    );
  };

  const removeTeam = (paId: string, domainId: string, teamId: string) => {
    setProductAreas(
      productAreas.map((pa) =>
        pa.id === paId
          ? {
              ...pa,
              domains: pa.domains.map((d) =>
                d.id === domainId
                  ? {
                      ...d,
                      teams:
                        d.teams.length > 1
                          ? d.teams.filter((t) => t.id !== teamId)
                          : d.teams,
                    }
                  : d
              ),
            }
          : pa
      )
    );
  };

  const updateTeam = (
    paId: string,
    domainId: string,
    teamId: string,
    field: 'name' | 'pmName',
    value: string
  ) => {
    setProductAreas(
      productAreas.map((pa) =>
        pa.id === paId
          ? {
              ...pa,
              domains: pa.domains.map((d) =>
                d.id === domainId
                  ? {
                      ...d,
                      teams: d.teams.map((t) =>
                        t.id === teamId ? { ...t, [field]: value } : t
                      ),
                    }
                  : d
              ),
            }
          : pa
      )
    );
  };

  const canProceedToStep2 = orgName.trim().length > 0;
  const canProceedToStep3 = productAreas.every((pa) => pa.name.trim().length > 0);
  const canSubmit = productAreas.every(
    (pa) =>
      pa.name.trim().length > 0 &&
      pa.domains.every(
        (d) =>
          d.name.trim().length > 0 &&
          d.teams.every((t) => t.name.trim().length > 0)
      )
  );

  const handleSubmit = async () => {
    if (!user || !canSubmit) return;

    setIsSubmitting(true);

    try {
      // Call edge function to set up organization (uses service role to bypass RLS)
      const { data, error } = await supabase.functions.invoke('setup-organization', {
        body: {
          orgName,
          productAreas: productAreas.map(pa => ({
            name: pa.name,
            domains: pa.domains.map(d => ({
              name: d.name,
              teams: d.teams.map(t => ({
                name: t.name,
                pmName: t.pmName || undefined,
              })),
            })),
          })),
        },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      await refreshProfile();

      toast({
        title: 'Organization created',
        description: 'Your organization structure is ready. You can now create OKRs.',
      });

      navigate('/');
    } catch (error) {
      console.error('Error creating organization:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to create organization. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background py-12 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Logo */}
        <div className="flex items-center justify-center gap-2 mb-8">
          <div className="w-8 h-8 rounded-md bg-primary flex items-center justify-center">
            <Target className="w-5 h-5 text-primary-foreground" />
          </div>
          <span className="font-semibold text-xl tracking-tight">TrueNorth</span>
        </div>

        <Card className="bg-card border">
          <CardHeader className="text-center pb-4">
            <CardTitle className="text-xl">Set up your organization</CardTitle>
            <CardDescription className="text-sm leading-relaxed">
              Before teams create OKRs, define your product areas, domains, and teams.
              This establishes how outcomes roll up and how confidence is aggregated.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {/* Step indicators */}
            <div className="flex items-center justify-center gap-2 mb-8">
              {[1, 2, 3].map((s) => (
                <div
                  key={s}
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors ${
                    step === s
                      ? 'bg-primary text-primary-foreground'
                      : step > s
                      ? 'bg-confidence-high text-primary-foreground'
                      : 'bg-muted text-muted-foreground'
                  }`}
                >
                  {s}
                </div>
              ))}
            </div>

            {/* Step 1: Organization name */}
            {step === 1 && (
              <div className="space-y-6 animate-fade-in">
                <div className="flex items-center gap-2 text-muted-foreground mb-4">
                  <Building2 className="w-4 h-4" />
                  <span className="text-xs font-medium uppercase tracking-wide">
                    Step 1: Organization
                  </span>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="orgName">Organization name</Label>
                  <Input
                    id="orgName"
                    placeholder="Acme Inc."
                    value={orgName}
                    onChange={(e) => setOrgName(e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">
                    This is your company or business unit name.
                  </p>
                </div>

                <Button
                  onClick={() => setStep(2)}
                  disabled={!canProceedToStep2}
                  className="w-full"
                >
                  Continue
                </Button>
              </div>
            )}

            {/* Step 2: Product Areas */}
            {step === 2 && (
              <div className="space-y-6 animate-fade-in">
                <div className="flex items-center gap-2 text-muted-foreground mb-4">
                  <Layers className="w-4 h-4" />
                  <span className="text-xs font-medium uppercase tracking-wide">
                    Step 2: Product Areas
                  </span>
                </div>

                <p className="text-sm text-muted-foreground">
                  Product areas are the highest level of your organization structure.
                  Each area contains domains and teams.
                </p>

                <div className="space-y-3">
                  {productAreas.map((pa, index) => (
                    <div key={pa.id} className="flex items-center gap-2">
                      <Input
                        placeholder={
                          index === 0
                            ? 'e.g., Booking'
                            : index === 1
                            ? 'e.g., Loyalty'
                            : 'Product Area'
                        }
                        value={pa.name}
                        onChange={(e) => updateProductArea(pa.id, e.target.value)}
                      />
                      {productAreas.length > 1 && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => removeProductArea(pa.id)}
                          className="shrink-0"
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                </div>

                <Button
                  variant="outline"
                  onClick={addProductArea}
                  className="w-full"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add product area
                </Button>

                <div className="flex gap-3">
                  <Button variant="outline" onClick={() => setStep(1)} className="flex-1">
                    Back
                  </Button>
                  <Button
                    onClick={() => setStep(3)}
                    disabled={!canProceedToStep3}
                    className="flex-1"
                  >
                    Continue
                  </Button>
                </div>
              </div>
            )}

            {/* Step 3: Domains and Teams */}
            {step === 3 && (
              <div className="space-y-6 animate-fade-in">
                <div className="flex items-center gap-2 text-muted-foreground mb-4">
                  <Users className="w-4 h-4" />
                  <span className="text-xs font-medium uppercase tracking-wide">
                    Step 3: Domains & Teams
                  </span>
                </div>

                <p className="text-sm text-muted-foreground">
                  Add domains within each product area, then teams within each domain.
                </p>

                <div className="space-y-6">
                  {productAreas.map((pa) => (
                    <div key={pa.id} className="border rounded-lg p-4">
                      <h4 className="font-medium text-sm mb-4 flex items-center gap-2">
                        <Layers className="w-4 h-4 text-muted-foreground" />
                        {pa.name}
                      </h4>

                      <div className="space-y-4 ml-4">
                        {pa.domains.map((domain) => (
                          <div key={domain.id} className="border-l-2 border-border pl-4">
                            <div className="flex items-center gap-2 mb-3">
                              <Input
                                placeholder="Domain name (e.g., Booking Funnel)"
                                value={domain.name}
                                onChange={(e) =>
                                  updateDomain(pa.id, domain.id, e.target.value)
                                }
                                className="flex-1"
                              />
                              {pa.domains.length > 1 && (
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => removeDomain(pa.id, domain.id)}
                                >
                                  <X className="w-4 h-4" />
                                </Button>
                              )}
                            </div>

                            <div className="space-y-2 ml-4">
                              {domain.teams.map((team) => (
                                <div key={team.id} className="flex items-center gap-2">
                                  <Input
                                    placeholder="Team name"
                                    value={team.name}
                                    onChange={(e) =>
                                      updateTeam(
                                        pa.id,
                                        domain.id,
                                        team.id,
                                        'name',
                                        e.target.value
                                      )
                                    }
                                    className="flex-1"
                                  />
                                  <Input
                                    placeholder="PM name (optional)"
                                    value={team.pmName}
                                    onChange={(e) =>
                                      updateTeam(
                                        pa.id,
                                        domain.id,
                                        team.id,
                                        'pmName',
                                        e.target.value
                                      )
                                    }
                                    className="flex-1"
                                  />
                                  {domain.teams.length > 1 && (
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      onClick={() =>
                                        removeTeam(pa.id, domain.id, team.id)
                                      }
                                    >
                                      <X className="w-4 h-4" />
                                    </Button>
                                  )}
                                </div>
                              ))}
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => addTeam(pa.id, domain.id)}
                                className="text-xs"
                              >
                                <Plus className="w-3 h-3 mr-1" />
                                Add team
                              </Button>
                            </div>
                          </div>
                        ))}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => addDomain(pa.id)}
                          className="text-xs"
                        >
                          <Plus className="w-3 h-3 mr-1" />
                          Add domain
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="flex gap-3">
                  <Button variant="outline" onClick={() => setStep(2)} className="flex-1">
                    Back
                  </Button>
                  <Button
                    onClick={handleSubmit}
                    disabled={!canSubmit || isSubmitting}
                    className="flex-1"
                  >
                    {isSubmitting ? (
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    ) : null}
                    Save structure
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
