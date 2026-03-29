import type {
  Game,
  Player,
  Buyin,
  GameEvent,
  Group,
  GroupMember,
  User,
} from "@/generated/prisma/client";

export type PlayerWithBuyins = Player & {
  buyins: Buyin[];
};

export type GameWithPlayers = Game & {
  players: PlayerWithBuyins[];
  group?: Pick<Group, "id" | "name"> | null;
};

export type GameWithPlayersAndEvents = GameWithPlayers & {
  events: GameEvent[];
};

export type GroupMemberWithUser = GroupMember & {
  user: Pick<User, "id" | "name" | "email" | "image"> | null;
};

export type GroupWithMembers = Group & {
  members: GroupMemberWithUser[];
};

export type GroupWithMemberCount = Group & {
  _count: { members: number };
};

export type PaymentInfo = {
  venmo?: string | null;
  zelle?: string | null;
  cashapp?: string | null;
  paypal?: string | null;
};
