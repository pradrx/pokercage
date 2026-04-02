"use client";

import { useState } from "react";
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
import { GroupPlayerSelector } from "@/components/group-player-selector";
import { toast } from "sonner";
import { Plus } from "lucide-react";
import type { GroupMemberWithUser } from "@/lib/types";

export function CreateGroupGameDialog({
  groupId,
  members,
}: {
  groupId: string;
  members: GroupMemberWithUser[];
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [localMembers, setLocalMembers] = useState(members);
  const [loading, setLoading] = useState(false);

  async function handleAddGuest(guestName: string) {
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
      setLocalMembers((prev) => [...prev, newMember]);
      setSelectedIds((prev) => new Set([...prev, newMember.id]));
    } catch {
      toast.error("Failed to add guest");
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || selectedIds.size === 0) return;

    setLoading(true);
    try {
      const res = await fetch("/api/games", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          date,
          groupId,
          playerMemberIds: Array.from(selectedIds),
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        toast.error(data.error || "Failed to create game");
        return;
      }

      const game = await res.json();
      setOpen(false);
      setName("");
      setSelectedIds(new Set());
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
      setLocalMembers(members);
      setSelectedIds(new Set());
      setName("");
      setDate(new Date().toISOString().split("T")[0]);
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger
        render={<Button><Plus className="mr-2 h-4 w-4" />New Game</Button>}
      />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create Group Game</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="game-name">Game Name</Label>
            <Input
              id="game-name"
              placeholder="Friday Night Poker"
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoFocus
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="game-date">Date</Label>
            <Input
              id="game-date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label>Players</Label>
            <GroupPlayerSelector
              members={localMembers}
              selectedIds={selectedIds}
              onSelectionChange={setSelectedIds}
              onAddGuest={handleAddGuest}
            />
          </div>
          <Button
            type="submit"
            disabled={loading || !name.trim() || selectedIds.size === 0}
          >
            {loading ? "Creating..." : "Create Game"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
