import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useApp } from '@/context/AppContext';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Copy, Check } from 'lucide-react';

const ONRAMP_DISMISSED_KEY = 'truenorth_onramp_dismissed';

export interface InviteSlideOverProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** When opened from a "No signal — invite members" row, pre-select this team */
  initialTeamId?: string | null;
}

export function InviteSlideOver({ open, onOpenChange, initialTeamId }: InviteSlideOverProps) {
  const { organization } = useAuth();
  const { teams } = useApp();
  const [copied, setCopied] = useState(false);
  const [selectedTeamId, setSelectedTeamId] = useState<string>(initialTeamId ?? '');
  const [selectedRole, setSelectedRole] = useState<'member' | 'admin'>('member');

  const inviteUrl = organization?.id
    ? `${typeof window !== 'undefined' ? window.location.origin : ''}/auth?org=${organization.id}`
    : '';

  useEffect(() => {
    if (!open) return;
    if (initialTeamId) {
      setSelectedTeamId(initialTeamId);
    } else if (teams.length > 0) {
      setSelectedTeamId(teams[0].id);
    }
  }, [open, initialTeamId, teams]);

  const handleCopy = async () => {
    if (!inviteUrl) return;
    try {
      await navigator.clipboard.writeText(inviteUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (_) {}
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
              Anyone with this link can join your organization.
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

          {/* Team assignment */}
          {teams.length > 0 && (
            <div className="space-y-2">
              <Label className="text-sm font-medium">Team assignment</Label>
              <Select
                value={selectedTeamId || teams[0]?.id || undefined}
                onValueChange={setSelectedTeamId}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a team" />
                </SelectTrigger>
                <SelectContent>
                  {teams.filter(t => t.id).map(t => (
                    <SelectItem key={t.id} value={t.id}>
                      {t.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                New members will be assigned to this team.
              </p>
            </div>
          )}

          {/* Role */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Role</Label>
            <Select value={selectedRole} onValueChange={(v) => setSelectedRole(v as 'member' | 'admin')}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="member">Member</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Members track outcomes. Admins manage structure.
            </p>
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
  } catch (_) {}
}

export function isOnrampDismissed(): boolean {
  try {
    return window.localStorage.getItem(ONRAMP_DISMISSED_KEY) === 'true';
  } catch {
    return false;
  }
}
