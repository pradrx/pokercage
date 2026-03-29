const USERNAME_MIN = 3;
const USERNAME_MAX = 16;
const USERNAME_REGEX = /^[a-zA-Z0-9_]+$/;

const RESERVED = new Set([
  "admin",
  "system",
  "guest",
  "pokercage",
  "poker_cage",
  "support",
  "help",
  "mod",
  "moderator",
  "null",
  "undefined",
  "anonymous",
  "deleted",
]);

export function validateUsername(
  input: string
): { valid: true } | { valid: false; error: string } {
  const trimmed = input.trim();

  if (trimmed.length < USERNAME_MIN) {
    return { valid: false, error: `Must be at least ${USERNAME_MIN} characters` };
  }
  if (trimmed.length > USERNAME_MAX) {
    return { valid: false, error: `Must be at most ${USERNAME_MAX} characters` };
  }
  if (!USERNAME_REGEX.test(trimmed)) {
    return { valid: false, error: "Only letters, numbers, and underscores allowed" };
  }
  if (RESERVED.has(trimmed.toLowerCase())) {
    return { valid: false, error: "This username is reserved" };
  }

  return { valid: true };
}

export function formatUsername(username: string): string {
  return `@${username}`;
}

type PlayerForDisplay = {
  name: string;
  groupMember?: {
    userId?: string | null;
    user?: { username?: string | null; name?: string | null } | null;
  } | null;
};

export function getDisplayName(player: PlayerForDisplay): string {
  const username = player.groupMember?.user?.username;
  if (username) return formatUsername(username);
  return player.name;
}

export function getFullName(player: PlayerForDisplay): string | null {
  if (!player.groupMember?.user?.username) return null;
  return player.groupMember?.user?.name ?? null;
}

export function isGuestPlayer(player: PlayerForDisplay): boolean {
  return !player.groupMember?.userId;
}

export function buildFullNameMap(
  players: PlayerForDisplay[]
): Record<string, string> {
  const map: Record<string, string> = {};
  for (const player of players) {
    const fullName = getFullName(player);
    if (fullName) {
      map[getDisplayName(player)] = fullName;
    }
  }
  return map;
}

type MemberForDisplay = {
  name: string;
  user?: { username?: string | null; name?: string | null } | null;
};

export function getMemberDisplayName(member: MemberForDisplay): string {
  const username = member.user?.username;
  if (username) return formatUsername(username);
  return member.user?.name ?? member.name;
}

export function getMemberFullName(member: MemberForDisplay): string | null {
  if (!member.user?.username) return null;
  return member.user?.name ?? null;
}
