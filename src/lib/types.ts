import type { Game, Player, Buyin, GameEvent } from "@/generated/prisma/client";

export type PlayerWithBuyins = Player & {
  buyins: Buyin[];
};

export type GameWithPlayers = Game & {
  players: PlayerWithBuyins[];
};

export type GameWithPlayersAndEvents = GameWithPlayers & {
  events: GameEvent[];
};
