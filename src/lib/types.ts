import type { Game, Player, Buyin } from "@/generated/prisma/client";

export type PlayerWithBuyins = Player & {
  buyins: Buyin[];
};

export type GameWithPlayers = Game & {
  players: PlayerWithBuyins[];
};
