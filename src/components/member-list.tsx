"use client";

import { useRouter } from "next/navigation";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import { MoreVertical, Trash2 } from "lucide-react";
import type { GroupMemberWithUser } from "@/lib/types";
import type { GroupRole } from "@/generated/prisma/client";

const roleBadgeVariant: Record<GroupRole, "default" | "secondary" | "outline"> = {
  OWNER: "default",
  ADMIN: "secondary",
  MEMBER: "outline",
};

export function MemberList({
  members,
  groupId,
  myRole,
}: {
  members: GroupMemberWithUser[];
  groupId: string;
  myRole: GroupRole;
}) {
  const router = useRouter();
  const isAdmin = myRole === "OWNER" || myRole === "ADMIN";

  async function removeMember(memberId: string) {
    try {
      const res = await fetch(`/api/groups/${groupId}/members/${memberId}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const data = await res.json();
        toast.error(data.error || "Failed to remove member");
        return;
      }
      router.refresh();
    } catch {
      toast.error("Failed to remove member");
    }
  }

  return (
    <div className="divide-y divide-border rounded-lg border">
      {members.map((member) => {
        const isGuest = !member.userId;
        const displayName = member.user?.name ?? member.name;
        const canManage = isAdmin && member.role !== "OWNER";

        return (
          <div
            key={member.id}
            className="flex items-center justify-between px-4 py-3"
          >
            <div className="flex items-center gap-3">
              <Avatar className="h-8 w-8">
                <AvatarImage src={member.user?.image ?? undefined} />
                <AvatarFallback>
                  {displayName.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">{displayName}</span>
                <Badge variant={roleBadgeVariant[member.role]}>
                  {member.role.charAt(0) + member.role.slice(1).toLowerCase()}
                </Badge>
                {isGuest && (
                  <Badge variant="outline" className="text-muted-foreground">
                    Guest
                  </Badge>
                )}
              </div>
            </div>

            {canManage && (
              <DropdownMenu>
                <DropdownMenuTrigger
                  render={
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  }
                />
                <DropdownMenuContent align="end">
                  <DropdownMenuItem
                    onClick={() => removeMember(member.id)}
                    className="text-destructive"
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Remove
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        );
      })}
    </div>
  );
}
