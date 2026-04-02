import { prisma } from "./prisma";
import type { GroupMember, Game } from "@/generated/prisma/client";

export async function getGroupMembership(
  groupId: string,
  userId: string
): Promise<GroupMember | null> {
  return prisma.groupMember.findFirst({
    where: { groupId, userId },
  });
}

export async function requireGroupMember(
  groupId: string,
  userId: string
): Promise<GroupMember> {
  const membership = await getGroupMembership(groupId, userId);
  if (!membership) {
    throw new AuthError("Not a member of this group", 403);
  }
  return membership;
}

export async function requireGroupAdmin(
  groupId: string,
  userId: string
): Promise<GroupMember> {
  const membership = await getGroupMembership(groupId, userId);
  if (!membership || (membership.role !== "OWNER" && membership.role !== "ADMIN")) {
    throw new AuthError("Must be a group owner or admin", 403);
  }
  return membership;
}

export async function canEditGame(
  game: Game,
  userId: string
): Promise<boolean> {
  if (game.userId === userId) return true;
  const membership = await getGroupMembership(game.groupId, userId);
  return membership?.role === "OWNER" || membership?.role === "ADMIN";
}

export async function canViewGame(
  game: Game,
  userId: string
): Promise<boolean> {
  if (game.userId === userId) return true;
  const membership = await getGroupMembership(game.groupId, userId);
  return membership !== null;
}

export function requireUsername(session: { user?: { username?: string | null } }): void {
  if (!session.user?.username) {
    throw new AuthError("Username setup required", 403);
  }
}

export class AuthError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}
