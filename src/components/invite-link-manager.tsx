"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { Copy, Link, X } from "lucide-react";

type Invite = {
  id: string;
  code: string;
  expiresAt: string;
};

const TTL_OPTIONS = [
  { label: "1 hour", value: "1" },
  { label: "6 hours", value: "6" },
  { label: "12 hours", value: "12" },
  { label: "24 hours", value: "24" },
  { label: "48 hours", value: "48" },
  { label: "7 days", value: "168" },
  { label: "Indefinite", value: "0" },
];

function formatExpiry(expiresAt: string) {
  const expiry = new Date(expiresAt);
  if (expiry.getFullYear() >= 9999) return "Never expires";
  const diff = expiry.getTime() - Date.now();
  if (diff <= 0) return "Expired";
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff / (1000 * 60)) % 60);
  if (hours >= 24) {
    const days = Math.floor(hours / 24);
    return `Expires in ${days}d ${hours % 24}h`;
  }
  if (hours > 0) return `Expires in ${hours}h ${minutes}m`;
  return `Expires in ${minutes}m`;
}

export function InviteLinkManager({ groupId }: { groupId: string }) {
  const [invite, setInvite] = useState<Invite | null>(null);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [revoking, setRevoking] = useState(false);
  const [confirmRevoke, setConfirmRevoke] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [ttlHours, setTtlHours] = useState("24");

  useEffect(() => {
    fetch(`/api/groups/${groupId}/invite`)
      .then((res) => res.json())
      .then((data) => setInvite(data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [groupId]);

  async function handleCreate() {
    setCreating(true);
    try {
      const res = await fetch(`/api/groups/${groupId}/invite`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ttlHours: Number(ttlHours) }),
      });
      if (!res.ok) {
        toast.error("Failed to create invite link");
        return;
      }
      const data = await res.json();
      setInvite(data);
      toast.success("Invite link created");
    } catch {
      toast.error("Failed to create invite link");
    } finally {
      setCreating(false);
    }
  }

  async function handleRevoke() {
    setRevoking(true);
    try {
      const res = await fetch(`/api/groups/${groupId}/invite`, {
        method: "DELETE",
      });
      if (!res.ok) {
        toast.error("Failed to revoke invite link");
        return;
      }
      setInvite(null);
      setConfirmRevoke(false);
      toast.success("Invite link revoked");
    } catch {
      toast.error("Failed to revoke invite link");
    } finally {
      setRevoking(false);
    }
  }

  function copyLink() {
    if (!invite) return;
    const url = `${window.location.origin}/invite/${invite.code}`;
    navigator.clipboard.writeText(url);
    toast.success("Link copied to clipboard");
  }

  if (loading) return null;

  return (
    <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
      <DialogTrigger
        render={
          <Button variant="outline" size="sm">
            <Link className="mr-2 h-4 w-4" />
            Invite Link
          </Button>
        }
      />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {invite ? "Invite Link" : "Create Invite Link"}
          </DialogTitle>
        </DialogHeader>
        {invite ? (
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-2">
              <Input
                value={`${typeof window !== "undefined" ? window.location.origin : ""}/invite/${invite.code}`}
                readOnly
                className="font-mono text-xs"
              />
              <Button variant="outline" size="icon" onClick={copyLink} title="Copy link">
                <Copy className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">
                {formatExpiry(invite.expiresAt)}
              </span>
              <Button
                variant="destructive"
                size="sm"
                onClick={() => setConfirmRevoke(true)}
              >
                <X className="mr-2 h-4 w-4" />
                Revoke
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium">Expires after</label>
              <Select value={ttlHours} onValueChange={(v) => v && setTtlHours(v)}>
                <SelectTrigger>
                  <SelectValue>
                    {TTL_OPTIONS.find((o) => o.value === ttlHours)?.label}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {TTL_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button onClick={handleCreate} disabled={creating}>
              {creating ? "Creating..." : "Generate Link"}
            </Button>
          </div>
        )}
      </DialogContent>

      {/* Revoke Confirmation Dialog */}
      <Dialog open={confirmRevoke} onOpenChange={setConfirmRevoke}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Revoke Invite Link</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Are you sure you want to revoke this invite link? Anyone with the
            link will no longer be able to join.
          </p>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setConfirmRevoke(false)}
              disabled={revoking}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleRevoke}
              disabled={revoking}
            >
              {revoking ? "Revoking..." : "Revoke"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Dialog>
  );
}
