"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { UserPlus, ChevronDown } from "lucide-react";
import type { GroupMemberWithUser } from "@/lib/types";
import { getMemberDisplayName } from "@/lib/username";

export function GroupGameAddPlayer({
  gameId,
  groupId,
  availableMembers,
}: {
  gameId: string;
  groupId: string;
  availableMembers: GroupMemberWithUser[];
}) {
  const router = useRouter();
  const [newName, setNewName] = useState("");
  const [loading, setLoading] = useState(false);
  const [pendingName, setPendingName] = useState<string | null>(null);

  async function addByMemberId(memberId: string) {
    setLoading(true);
    try {
      const res = await fetch(`/api/games/${gameId}/players`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ groupMemberId: memberId }),
      });
      if (!res.ok) {
        const data = await res.json();
        toast.error(data.error || "Failed to add player");
        return;
      }
      router.refresh();
    } catch {
      toast.error("Failed to add player");
    } finally {
      setLoading(false);
    }
  }

  function handleAddByName(e: React.FormEvent) {
    e.preventDefault();
    if (!newName.trim()) return;
    setPendingName(newName.trim());
  }

  async function handleConfirm() {
    if (!pendingName) return;

    setLoading(true);
    setPendingName(null);
    try {
      const res = await fetch(`/api/games/${gameId}/players`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: pendingName }),
      });
      if (!res.ok) {
        const data = await res.json();
        toast.error(data.error || "Failed to add player");
        return;
      }
      setNewName("");
      router.refresh();
    } catch {
      toast.error("Failed to add player");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <div className="flex gap-2">
        {availableMembers.length > 0 && (
          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <Button variant="outline" disabled={loading}>
                  <UserPlus className="mr-2 h-4 w-4" />
                  Add Member
                  <ChevronDown className="ml-2 h-3.5 w-3.5" />
                </Button>
              }
            />
            <DropdownMenuContent align="start" className="max-h-64 overflow-y-auto">
              {availableMembers.map((member) => {
                const displayName = getMemberDisplayName(member);
                const isGuest = !member.userId;
                return (
                  <DropdownMenuItem
                    key={member.id}
                    onClick={() => addByMemberId(member.id)}
                  >
                    <Avatar className="h-5 w-5 mr-2">
                      <AvatarImage src={member.user?.image ?? undefined} />
                      <AvatarFallback className="text-xs">
                        {displayName.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    {displayName}
                    {isGuest && (
                      <Badge variant="outline" className="ml-2 text-muted-foreground">
                        Guest
                      </Badge>
                    )}
                  </DropdownMenuItem>
                );
              })}
            </DropdownMenuContent>
          </DropdownMenu>
        )}

        <form onSubmit={handleAddByName} className="flex gap-2">
          <Input
            placeholder="Add someone new..."
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            className="max-w-xs"
          />
          <Button
            type="submit"
            variant="outline"
            disabled={loading || !newName.trim()}
          >
            <UserPlus className="mr-2 h-4 w-4" />
            Add
          </Button>
        </form>
      </div>

      <AlertDialog
        open={!!pendingName}
        onOpenChange={(open) => {
          if (!open) setPendingName(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Add Guest</AlertDialogTitle>
            <AlertDialogDescription>
              This will create a guest named &ldquo;{pendingName}&rdquo; in your
              group.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirm}>
              Add Guest
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
