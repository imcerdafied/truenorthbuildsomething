import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetFooter,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Copy, Check } from 'lucide-react';

const ONRAMP_DISMISSED_KEY = 'truenorth_onramp_dismissed';

export interface InviteSlideOverProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Reserved for future invite assignment support */
  initialTeamId?: string | null;
}

export function InviteSlideOver({ open, onOpenChange }: InviteSlideOverProps) {
  const { organization } = useAuth();
  const [copied, setCopied] = useState(false);

  const inviteUrl = organization?.id
    ? `${typeof window !== 'undefined' ? window.location.origin : ''}/auth?org=${organization.id}`
    : '';

  const handleCopy = async () => {
    if (!inviteUrl) return;
    try {
      await navigator.clipboard.writeText(inviteUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (_) {
      // Clipboard access can fail in restricted browser contexts.
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-96 max-w-[calc(100vw-2rem)] sm:max-w-md bg-white dark:bg-card shadow-xl transition-transform duration-300 flex flex-col"
      >
        <SheetHeader>
          <SheetTitle>Invite team members</SheetTitle>
        </SheetHeader>

        <div className="flex-1 overflow-auto space-y-6 py-4">
          {/* Shareable invite link */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Share this link with your team</Label>
            <div className="flex gap-2">
              <Input
                readOnly
                value={inviteUrl}
                className="flex-1 bg-muted text-sm font-mono"
              />
              <Button variant="outline" size="sm" onClick={handleCopy} className="shrink-0 gap-1.5">
                {copied ? (
                  <>
                    <Check className="w-4 h-4 text-green-600" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    Copy link
                  </>
                )}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Anyone with this link can join your organization as a member.
            </p>
          </div>

          {/* Email invites (coming soon) */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Or invite by email</Label>
            <Textarea
              placeholder="Email addresses (coming soon)"
              disabled
              className="min-h-[80px] resize-none bg-muted opacity-70"
            />
            <p className="text-xs text-muted-foreground">Email invites coming soon.</p>
          </div>
        </div>

        <SheetFooter className="flex flex-col gap-2 sm:flex-col">
          <Button onClick={() => onOpenChange(false)} className="w-full">
            Done
          </Button>
          <p className="text-xs text-muted-foreground text-center w-full">
            Invites unlock confidence signals within 24–48 hours.
          </p>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}

export function setOnrampDismissed() {
  try {
    window.localStorage.setItem(ONRAMP_DISMISSED_KEY, 'true');
  } catch (_) {
    // Ignore localStorage failures (private mode / blocked storage).
  }
}

export function isOnrampDismissed(): boolean {
  try {
    return window.localStorage.getItem(ONRAMP_DISMISSED_KEY) === 'true';
  } catch {
    return false;
  }
}
