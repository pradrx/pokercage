import { prisma } from "@/lib/prisma";
import { formatUsername } from "@/lib/username";
import type { GameEventType } from "@/generated/prisma/client";

export function actorDisplayName(session: {
  user?: { username?: string | null; name?: string | null } | null;
}): string | undefined {
  const u = session.user;
  if (!u) return undefined;
  if (u.username) return formatUsername(u.username);
  return u.name ?? undefined;
}

export async function playerDisplayName(playerId: string): Promise<string> {
  const player = await prisma.player.findUnique({
    where: { id: playerId },
    select: {
      name: true,
      groupMember: {
        select: {
          user: { select: { username: true } },
        },
      },
    },
  });
  if (!player) return "Unknown";
  if (player.groupMember?.user?.username) {
    return formatUsername(player.groupMember.user.username);
  }
  return player.name;
}

export async function createGameEvent(params: {
  type: GameEventType;
  gameId: string;
  actorId?: string;
  actorName?: string;
  playerName?: string;
  detail: string;
  oldValue?: string | null;
  newValue?: string | null;
}) {
  return prisma.gameEvent.create({
    data: {
      type: params.type,
      gameId: params.gameId,
      actorId: params.actorId ?? null,
      actorName: params.actorName ?? null,
      playerName: params.playerName ?? null,
      detail: params.detail,
      oldValue: params.oldValue ?? null,
      newValue: params.newValue ?? null,
    },
  });
}
