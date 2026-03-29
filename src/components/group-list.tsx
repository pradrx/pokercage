"use client";

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { GroupRole } from "@/generated/prisma/client";

type GroupItem = {
  id: string;
  name: string;
  myRole: GroupRole;
  _count: { members: number };
};

const roleBadgeVariant: Record<GroupRole, "default" | "secondary" | "outline"> = {
  OWNER: "default",
  ADMIN: "secondary",
  MEMBER: "outline",
};

export function GroupList({ groups }: { groups: GroupItem[] }) {
  if (groups.length === 0) {
    return (
      <p className="text-center text-muted-foreground py-12">
        No groups yet. Create your first group to get started.
      </p>
    );
  }

  return (
    <div className="grid gap-4">
      {groups.map((group) => (
        <Link key={group.id} href={`/groups/${group.id}`}>
          <Card className="transition-colors hover:border-primary/50">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-base">{group.name}</CardTitle>
              <Badge variant={roleBadgeVariant[group.myRole]}>
                {group.myRole.charAt(0) + group.myRole.slice(1).toLowerCase()}
              </Badge>
            </CardHeader>
            <CardContent>
              <div className="text-sm text-muted-foreground">
                {group._count.members} {group._count.members === 1 ? "member" : "members"}
              </div>
            </CardContent>
          </Card>
        </Link>
      ))}
    </div>
  );
}
