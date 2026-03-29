"use client";

import { useState } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { UserPlus } from "lucide-react";
import type { GroupMemberWithUser } from "@/lib/types";
import { getMemberDisplayName } from "@/lib/username";

export function GroupPlayerSelector({
  members,
  selectedIds,
  onSelectionChange,
  onAddGuest,
}: {
  members: GroupMemberWithUser[];
  selectedIds: Set<string>;
  onSelectionChange: (ids: Set<string>) => void;
  onAddGuest?: (name: string) => void;
}) {
  const [newName, setNewName] = useState("");

  function toggleMember(memberId: string) {
    const next = new Set(selectedIds);
    if (next.has(memberId)) {
      next.delete(memberId);
    } else {
      next.add(memberId);
    }
    onSelectionChange(next);
  }

  function selectAll() {
    onSelectionChange(new Set(members.map((m) => m.id)));
  }

  function selectNone() {
    onSelectionChange(new Set());
  }

  const allSelected = members.length > 0 && selectedIds.size === members.length;

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <span className="text-sm text-muted-foreground">
          {selectedIds.size} of {members.length} selected
        </span>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={allSelected ? selectNone : selectAll}
        >
          {allSelected ? "Deselect all" : "Select all"}
        </Button>
      </div>

      <div className="divide-y divide-border rounded-lg border max-h-64 overflow-y-auto">
        {members.map((member) => {
          const isGuest = !member.userId;
          const displayName = getMemberDisplayName(member);

          return (
            <label
              key={member.id}
              className="flex items-center gap-3 px-3 py-2.5 cursor-pointer hover:bg-muted/50 transition-colors"
            >
              <Checkbox
                checked={selectedIds.has(member.id)}
                onCheckedChange={() => toggleMember(member.id)}
              />
              <Avatar className="h-6 w-6">
                <AvatarImage src={member.user?.image ?? undefined} />
                <AvatarFallback className="text-xs">
                  {displayName.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <span className="text-sm">{displayName}</span>
              {isGuest && (
                <Badge variant="outline" className="text-muted-foreground">
                  Guest
                </Badge>
              )}
            </label>
          );
        })}
      </div>

      {onAddGuest && (
        <div className="flex gap-2">
          <Input
            placeholder="Add someone new..."
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && newName.trim()) {
                e.preventDefault();
                onAddGuest(newName.trim());
                setNewName("");
              }
            }}
            className="text-sm"
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={!newName.trim()}
            onClick={() => {
              if (newName.trim()) {
                onAddGuest(newName.trim());
                setNewName("");
              }
            }}
          >
            <UserPlus className="mr-1 h-3.5 w-3.5" />
            Add
          </Button>
        </div>
      )}
    </div>
  );
}
