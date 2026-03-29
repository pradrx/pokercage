import { prisma } from "@/lib/prisma";
import type { GameEventType } from "@/generated/prisma/client";

export async function createGameEvent(params: {
  type: GameEventType;
  gameId: string;
  playerName?: string;
  detail: string;
  oldValue?: string | null;
  newValue?: string | null;
}) {
  return prisma.gameEvent.create({
    data: {
      type: params.type,
      gameId: params.gameId,
      playerName: params.playerName ?? null,
      detail: params.detail,
      oldValue: params.oldValue ?? null,
      newValue: params.newValue ?? null,
    },
  });
}
