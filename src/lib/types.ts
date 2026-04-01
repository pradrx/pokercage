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
  groupMember?: {
    userId?: string | null;
    venmo?: string | null;
    zelle?: string | null;
    cashapp?: string | null;
    paypal?: string | null;
    user?: {
      username?: string | null;
      name?: string | null;
      venmo?: string | null;
      zelle?: string | null;
      cashapp?: string | null;
      paypal?: string | null;
    } | null;
  } | null;
};

export type GameWithPlayers = Game & {
  players: PlayerWithBuyins[];
  group: Pick<Group, "id" | "name">;
};

export type GameWithPlayersAndEvents = GameWithPlayers & {
  events: GameEvent[];
};

export type GroupMemberWithUser = GroupMember & {
  user: Pick<User, "id" | "name" | "email" | "image" | "username"> | null;
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
