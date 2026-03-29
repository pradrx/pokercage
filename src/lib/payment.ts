import type { PaymentInfo } from "./types";

type PlayerWithPaymentChain = {
  name: string;
  groupMember?: {
    venmo?: string | null;
    zelle?: string | null;
    cashapp?: string | null;
    paypal?: string | null;
    user?: {
      venmo?: string | null;
      zelle?: string | null;
      cashapp?: string | null;
      paypal?: string | null;
    } | null;
  } | null;
};

export function buildPaymentInfoMap(
  players: PlayerWithPaymentChain[]
): Record<string, PaymentInfo> {
  const map: Record<string, PaymentInfo> = {};

  for (const player of players) {
    const gm = player.groupMember;
    if (!gm) continue;

    const user = gm.user;
    const venmo = gm.venmo ?? user?.venmo ?? null;
    const zelle = gm.zelle ?? user?.zelle ?? null;
    const cashapp = gm.cashapp ?? user?.cashapp ?? null;
    const paypal = gm.paypal ?? user?.paypal ?? null;

    if (venmo || zelle || cashapp || paypal) {
      map[player.name] = { venmo, zelle, cashapp, paypal };
    }
  }

  return map;
}
