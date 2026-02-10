import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export function OrganizationSetupPage() {
  const { user, refreshProfile } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [orgName, setOrgName] = useState('');
  const [teamName, setTeamName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const canSubmit = orgName.trim().length > 0 && teamName.trim().length > 0;

  const handleSubmit = async () => {
    if (!user || !canSubmit) return;

    setIsSubmitting(true);

    try {
      // 1. Create organization
      const { data: org, error: orgError } = await supabase
        .from('organizations')
        .insert({ name: orgName, setup_complete: true })
        .select('id')
        .single();

      if (orgError || !org) {
        throw new Error(orgError?.message || 'Failed to create organization');
      }

      // 2. Link user profile to organization
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ organization_id: org.id })
        .eq('id', user.id);

      if (profileError) {
        // Rollback: delete the org we just created
        await supabase.from('organizations').delete().eq('id', org.id);
        throw new Error(profileError.message || 'Failed to update profile');
      }

      // 3. Assign admin role to user
      const { error: roleError } = await supabase
        .from('user_roles')
        .insert({ user_id: user.id, role: 'admin' });

      if (roleError) {
        console.error('Error assigning admin role:', roleError);
        // Continue — role can be fixed later, org is already created
      }

      // 4. Create product areas, domains, and teams (single PA/domain/team from form)
      const productAreas = [
        {
          name: 'Main',
          domains: [
            {
              name: 'Default',
              teams: [{ name: teamName.trim(), pmName: null as string | null }],
            },
          ],
        },
      ];

      for (const pa of productAreas) {
        if (!pa.name?.trim()) continue;

        const { data: paData, error: paError } = await supabase
          .from('product_areas')
          .insert({ name: pa.name, organization_id: org.id })
          .select('id')
          .single();

        if (paError || !paData) {
          console.error('Error creating product area:', paError);
          continue;
        }

        for (const domain of pa.domains || []) {
          if (!domain.name?.trim()) continue;

          const { data: domainData, error: domainError } = await supabase
            .from('domains')
            .insert({ name: domain.name, product_area_id: paData.id })
            .select('id')
            .single();

          if (domainError || !domainData) {
            console.error('Error creating domain:', domainError);
            continue;
          }

          for (const team of domain.teams || []) {
            if (!team.name?.trim()) continue;

            const { error: teamError } = await supabase
              .from('teams')
              .insert({
                name: team.name,
                domain_id: domainData.id,
                pm_name: team.pmName || null,
              });

            if (teamError) {
              console.error('Error creating team:', teamError);
            }
          }
        }
      }

      await refreshProfile();

      toast({
        title: 'Organization created',
        description: 'Your organization structure is ready. You can now create OKRs.',
      });

      navigate('/first-outcome');
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
    <div className="min-h-screen flex items-center justify-center p-4 bg-background">
      <div className="w-full max-w-md">
        <Card className="border-border/60">
          <CardContent className="pt-8 pb-8 px-8">
            <div className="text-center mb-8">
              <h1 className="text-2xl font-semibold tracking-tight">
                Get started
              </h1>
              <p className="text-sm text-muted-foreground mt-2">
                Set up your organization and first team. You can add more teams and structure later in Settings.
              </p>
            </div>

            <div className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="orgName">Organization</Label>
                <Input
                  id="orgName"
                  placeholder="Acme Inc."
                  value={orgName}
                  onChange={(e) => setOrgName(e.target.value)}
                  autoFocus
                />
                <p className="text-xs text-muted-foreground">
                  Your company or business unit.
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="teamName">Your team</Label>
                <Input
                  id="teamName"
                  placeholder="e.g., Booking Experience"
                  value={teamName}
                  onChange={(e) => setTeamName(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  The team that will own OKRs.
                </p>
              </div>

              <Button
                onClick={handleSubmit}
                disabled={!canSubmit || isSubmitting}
                className="w-full mt-2"
              >
                {isSubmitting ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                ) : null}
                Start tracking outcomes
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
