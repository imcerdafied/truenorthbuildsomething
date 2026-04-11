import { useState, useEffect } from 'react';
import { fetchLinkedBet, type LinkedBet } from '@/lib/crossApp';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { Zap } from 'lucide-react';

interface LinkedBetCardProps {
  okrId: string;
  linkedBetId: string | null;
  linkedBetTitle: string | null;
}

const STATUS_LABELS: Record<string, string> = {
  defined: 'Defined',
  activated: 'Active',
  proving_value: 'Proving Value',
  scaling: 'Scaling',
  durable: 'Durable',
  closed: 'Closed',
};

export function LinkedBetCard({ okrId, linkedBetId, linkedBetTitle }: LinkedBetCardProps) {
  const [bet, setBet] = useState<LinkedBet | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [inputId, setInputId] = useState('');
  const [preview, setPreview] = useState<LinkedBet | null>(null);
  const [fetching, setFetching] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!linkedBetId) { setBet(null); return; }
    fetchLinkedBet(linkedBetId).then(setBet);
  }, [linkedBetId]);

  const handleFetchPreview = async () => {
    const id = inputId.trim();
    if (!id) return;
    setFetching(true);
    setError(null);
    setPreview(null);
    try {
      const result = await fetchLinkedBet(id);
      if (result) setPreview(result);
      else setError('Bet not found. Check the ID and try again.');
    } catch {
      setError('Failed to fetch. Please try again.');
    } finally {
      setFetching(false);
    }
  };

  const handleLink = async () => {
    if (!preview) return;
    await supabase
      .from('okrs')
      .update({ linked_bet_id: preview.id, linked_bet_title: preview.title })
      .eq('id', okrId);
    setBet(preview);
    setDialogOpen(false);
    setInputId('');
    setPreview(null);
    window.location.reload();
  };

  const handleUnlink = async () => {
    await supabase
      .from('okrs')
      .update({ linked_bet_id: null, linked_bet_title: null })
      .eq('id', okrId);
    setBet(null);
    window.location.reload();
  };

  const title = bet?.title ?? linkedBetTitle ?? null;
  const statusLabel = bet?.status ? (STATUS_LABELS[bet.status] ?? bet.status) : null;

  return (
    <Card className="border-border/60">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-medium flex items-center gap-2">
            <Zap className="w-4 h-4 text-muted-foreground" />
            Bets Altitude
          </CardTitle>
          <a
            href="https://buildauthority.vercel.app"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[10px] text-muted-foreground hover:text-foreground"
          >
            Build Authority ↗
          </a>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        {title ? (
          <div className="border border-border/60 rounded-lg p-3 group relative">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium truncate">{title}</p>
                <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                  {statusLabel && <span>{statusLabel}</span>}
                  {bet?.score != null && (
                    <>
                      <span>·</span>
                      <span>Score {bet.score}</span>
                    </>
                  )}
                </div>
              </div>
              <button
                onClick={handleUnlink}
                className="opacity-0 group-hover:opacity-100 text-xs text-muted-foreground hover:text-destructive transition-opacity"
                title="Unlink bet"
              >
                ✕
              </button>
            </div>
            {bet?.url && (
              <a
                href={bet.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[10px] text-muted-foreground hover:text-foreground mt-1 inline-block"
              >
                Open in Build Authority ↗
              </a>
            )}
          </div>
        ) : (
          <Button
            variant="outline"
            size="sm"
            className="w-full text-xs"
            onClick={() => setDialogOpen(true)}
          >
            + Link a Bet
          </Button>
        )}
      </CardContent>

      <Dialog
        open={dialogOpen}
        onOpenChange={(v) => {
          setDialogOpen(v);
          if (!v) { setInputId(''); setPreview(null); setError(null); }
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Link a Bet from Build Authority</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div className="flex gap-2">
              <Input
                value={inputId}
                onChange={(e) => setInputId(e.target.value)}
                placeholder="Paste Bet ID (UUID)"
                className="flex-1 font-mono text-xs"
                onKeyDown={(e) => { if (e.key === 'Enter') handleFetchPreview(); }}
              />
              <Button variant="outline" size="sm" onClick={handleFetchPreview} disabled={fetching || !inputId.trim()}>
                {fetching ? '...' : 'Fetch'}
              </Button>
            </div>
            {error && <p className="text-xs text-destructive">{error}</p>}
            {preview && (
              <div className="border border-border rounded-lg p-3 bg-muted/30">
                <p className="text-sm font-medium">{preview.title}</p>
                <p className="text-[10px] text-muted-foreground mt-1 font-mono">{preview.id}</p>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleLink} disabled={!preview}>Confirm Link</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
