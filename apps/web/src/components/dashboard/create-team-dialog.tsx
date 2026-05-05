'use client';

import { useAuth } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import { useRef, useState } from 'react';
import { Camera, X, Plus } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { TeamAvatar } from '@/components/shared/team-avatar';
import { apiFetchWithToken, apiUploadFile } from '@/lib/api';
import { ACTIVE_TEAM_COOKIE } from '@/lib/dashboard-constants';

const ACCEPTED_TYPES = ['image/png', 'image/jpeg', 'image/webp'];
const MAX_SIZE = 5 * 1024 * 1024;

export function CreateTeamDialog({
  trigger,
  onCreated,
}: {
  trigger?: React.ReactNode;
  onCreated?: () => void;
}) {
  const { getToken } = useAuth();
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);

  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function reset() {
    setName('');
    setAvatarFile(null);
    setAvatarPreview(null);
    setError(null);
    setCreating(false);
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!ACCEPTED_TYPES.includes(file.type)) {
      setError('Invalid file type. Use PNG, JPG, or WebP.');
      return;
    }
    if (file.size > MAX_SIZE) {
      setError('Image too large. Max 5 MB.');
      return;
    }

    setError(null);
    setAvatarFile(file);
    const url = URL.createObjectURL(file);
    setAvatarPreview(url);
  }

  function removeAvatar() {
    setAvatarFile(null);
    if (avatarPreview) {
      URL.revokeObjectURL(avatarPreview);
      setAvatarPreview(null);
    }
    if (fileRef.current) fileRef.current.value = '';
  }

  async function handleCreate() {
    if (!name.trim()) return;
    setCreating(true);
    setError(null);

    try {
      const token = await getToken();
      if (!token) return;

      let logoUrl: string | undefined;

      if (avatarFile) {
        const fd = new FormData();
        fd.append('file', avatarFile);
        const uploadResult = await apiUploadFile<{ url: string }>(
          '/uploads/team-avatar',
          token,
          fd,
        );
        logoUrl = uploadResult.url;
      }

      const created = await apiFetchWithToken<{
        id: string;
        name: string;
        slug: string;
      }>('/team', token, {
        method: 'POST',
        body: JSON.stringify({
          name: name.trim(),
          ...(logoUrl ? { logoUrl } : {}),
        }),
      });

      document.cookie = `${ACTIVE_TEAM_COOKIE}=${encodeURIComponent(created.id)}; path=/; max-age=31536000; SameSite=Lax`;

      try {
        await apiFetchWithToken('/auth/switch-team', token, {
          method: 'POST',
          body: JSON.stringify({ teamId: created.id }),
        });
      } catch {
        // best-effort
      }

      reset();
      setOpen(false);
      onCreated?.();
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create team');
      setCreating(false);
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        setOpen(nextOpen);
        if (!nextOpen) reset();
      }}
    >
      <DialogTrigger
        render={
          trigger ?? (
            <Button size="sm" variant="outline">
              <Plus className="mr-1.5 size-3.5" />
              New Team
            </Button>
          )
        }
      />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create a new team</DialogTitle>
          <DialogDescription>
            Give your team a name and optional avatar.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 py-2">
          {/* Avatar upload area */}
          <div className="flex items-center gap-4">
            <div className="relative">
              {avatarPreview ? (
                <img
                  src={avatarPreview}
                  alt="Team avatar preview"
                  className="size-16 rounded-xl object-cover"
                />
              ) : (
                <TeamAvatar name={name || 'T'} size="lg" className="size-16 rounded-xl text-lg" />
              )}
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                className="absolute -bottom-1 -right-1 flex size-6 items-center justify-center rounded-full border-2 border-background bg-primary text-primary-foreground transition hover:bg-primary/90"
              >
                <Camera className="size-3" />
              </button>
              {avatarPreview && (
                <button
                  type="button"
                  onClick={removeAvatar}
                  className="absolute -top-1 -right-1 flex size-5 items-center justify-center rounded-full border-2 border-background bg-destructive text-destructive-foreground"
                >
                  <X className="size-2.5" />
                </button>
              )}
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-foreground">Team avatar</p>
              <p className="text-xs text-muted-foreground">
                PNG, JPG, or WebP. Max 5 MB.
              </p>
            </div>
            <input
              ref={fileRef}
              type="file"
              accept="image/png,image/jpeg,image/webp"
              onChange={handleFileChange}
              className="hidden"
            />
          </div>

          {/* Team name */}
          <div className="space-y-1.5">
            <label
              htmlFor="team-name"
              className="text-sm font-medium text-foreground"
            >
              Team name
            </label>
            <input
              id="team-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && !creating && handleCreate()}
              placeholder="e.g. Engineering"
              autoFocus
              className="w-full rounded-lg border border-border bg-muted/40 px-3 py-2 text-sm text-foreground outline-none transition placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/50"
            />
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}
        </div>

        <DialogFooter>
          <Button
            variant="ghost"
            onClick={() => {
              reset();
              setOpen(false);
            }}
            disabled={creating}
          >
            Cancel
          </Button>
          <Button
            onClick={handleCreate}
            disabled={creating || !name.trim()}
          >
            {creating ? 'Creating…' : 'Create Team'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
