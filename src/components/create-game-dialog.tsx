"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { GroupPlayerSelector } from "@/components/group-player-selector";
import { toast } from "sonner";
import { Plus } from "lucide-react";
import type { GroupMemberWithUser } from "@/lib/types";

type GroupOption = {
  id: string;
  name: string;
};

export function CreateGameDialog({ groups = [] }: { groups?: GroupOption[] }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [groupId, setGroupId] = useState<string | null>(null);
  const [members, setMembers] = useState<GroupMemberWithUser[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [loadingMembers, setLoadingMembers] = useState(false);
  const [loading, setLoading] = useState(false);

  // Fetch members when group changes
  useEffect(() => {
    if (!groupId) {
      setMembers([]);
      setSelectedIds(new Set());
      return;
    }

    setLoadingMembers(true);
    fetch(`/api/groups/${groupId}/members`)
      .then((res) => res.json())
      .then((data) => {
        setMembers(data);
        setSelectedIds(new Set());
      })
      .catch(() => {
        toast.error("Failed to load group members");
        setMembers([]);
      })
      .finally(() => setLoadingMembers(false));
  }, [groupId]);

  async function handleAddGuest(guestName: string) {
    if (!groupId) return;
    try {
      const res = await fetch(`/api/groups/${groupId}/members`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: guestName }),
      });
      if (!res.ok) {
        const data = await res.json();
        toast.error(data.error || "Failed to add guest");
        return;
      }
      const newMember = await res.json();
      setMembers((prev) => [...prev, newMember]);
      setSelectedIds((prev) => new Set([...prev, newMember.id]));
    } catch {
      toast.error("Failed to add guest");
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    if (groupId && selectedIds.size === 0) return;

    setLoading(true);
    try {
      const body: Record<string, unknown> = {
        name: name.trim(),
        date,
        groupId,
        playerMemberIds: Array.from(selectedIds),
      };

      const res = await fetch("/api/games", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const data = await res.json();
        toast.error(data.error || "Failed to create game");
        return;
      }

      const game = await res.json();
      setOpen(false);
      router.push(`/games/${game.slug ?? game.id}`);
    } catch {
      toast.error("Failed to create game");
    } finally {
      setLoading(false);
    }
  }

  function handleOpenChange(isOpen: boolean) {
    setOpen(isOpen);
    if (isOpen) {
      setName("");
      setDate(new Date().toISOString().split("T")[0]);
      setGroupId(null);
      setMembers([]);
      setSelectedIds(new Set());
    }
  }

  const canSubmit = name.trim() && !!groupId && selectedIds.size > 0;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger
        render={<Button><Plus className="mr-2 h-4 w-4" />New Game</Button>}
      />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create New Game</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="name">Game Name</Label>
            <Input
              id="name"
              placeholder="Friday Night Poker"
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoFocus
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="date">Date</Label>
            <Input
              id="date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </div>

          {groups.length > 0 ? (
            <>
              <div className="flex flex-col gap-2">
                <Label>Group</Label>
                <Select
                  value={groupId ?? ""}
                  onValueChange={(val) => setGroupId(val || null)}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select a group">
                      {groupId
                        ? groups.find((g) => g.id === groupId)?.name
                        : "Select a group"}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {groups.map((g) => (
                      <SelectItem key={g.id} value={g.id}>
                        {g.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {groupId && (
                <div className="flex flex-col gap-2">
                  <Label>Players</Label>
                  {loadingMembers ? (
                    <p className="text-sm text-muted-foreground">Loading members...</p>
                  ) : (
                    <GroupPlayerSelector
                      members={members}
                      selectedIds={selectedIds}
                      onSelectionChange={setSelectedIds}
                      onAddGuest={handleAddGuest}
                    />
                  )}
                </div>
              )}

              <Button type="submit" disabled={loading || !canSubmit}>
                {loading ? "Creating..." : "Create Game"}
              </Button>
            </>
          ) : (
            <p className="text-sm text-muted-foreground">
              You need to create a group before starting a game.
            </p>
          )}
        </form>
      </DialogContent>
    </Dialog>
  );
}
