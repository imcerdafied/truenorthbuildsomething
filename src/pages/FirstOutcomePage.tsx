import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Plus } from 'lucide-react';

export function FirstOutcomePage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background">
      <div className="w-full max-w-md">
        <Card className="border-border/60">
          <CardContent className="pt-8 pb-8 px-8">
            <div className="text-center mb-8">
              <h1 className="text-2xl font-semibold tracking-tight">
                Start your first outcome
              </h1>
              <p className="text-sm text-muted-foreground mt-2">
                You don&apos;t need to configure your organization yet. Define one outcome to establish your first signal.
              </p>
            </div>

            <div className="space-y-5">
              <Button
                onClick={() => navigate('/okrs/create')}
                className="w-full gap-2"
              >
                <Plus className="w-4 h-4" />
                Create first outcome
              </Button>
              <div className="text-center">
                <button
                  type="button"
                  onClick={() => navigate('/')}
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  Skip for now →
                </button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
