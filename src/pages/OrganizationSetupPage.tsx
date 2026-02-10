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
  const [pmName, setPmName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const canSubmit = orgName.trim().length > 0 && teamName.trim().length > 0;

  const handleSubmit = async () => {
    if (!user || !canSubmit) return;

    setIsSubmitting(true);

    try {
      const { data, error } = await supabase.functions.invoke('setup-organization', {
        body: {
          orgName,
          teamName,
          pmName: pmName.trim() || undefined,
        },
      });

      if (error) throw error;

      toast({
        title: 'You\'re in!',
        description: `${orgName} is ready. Create your first OKR.`,
      });

      await refreshProfile();
      navigate('/', { replace: true });
    } catch (error: any) {
      console.error('Setup error:', error);
      toast({
        title: 'Setup failed',
        description: error.message || 'Something went wrong. Please try again.',
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

              <div className="space-y-2">
                <Label htmlFor="pmName">
                  Your name <span className="text-muted-foreground font-normal">(optional)</span>
                </Label>
                <Input
                  id="pmName"
                  placeholder="e.g., Sarah Chen"
                  value={pmName}
                  onChange={(e) => setPmName(e.target.value)}
                />
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
