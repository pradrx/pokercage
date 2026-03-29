export type PlayerBalance = {
  name: string;
  balance: number;
};

export type Payout = {
  from: string;
  to: string;
  amount: number;
};

export type AdjustmentResult = {
  adjusted: PlayerBalance[];
  delta: number;
  adjustments: Map<string, number>;
};

const TOLERANCE = 0.01;

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

export function buildPlayerBalances(
  players: { name: string; cashout: number | null; buyins: { amount: number }[] }[]
): PlayerBalance[] {
  return players.map((p) => ({
    name: p.name,
    balance: (p.cashout ?? 0) - p.buyins.reduce((s, b) => s + b.amount, 0),
  }));
}

export function canAdjustBalances(players: PlayerBalance[]): boolean {
  const delta = players.reduce((sum, p) => sum + p.balance, 0);
  if (Math.abs(delta) < TOLERANCE) return true;

  const hasWinners = players.some((p) => p.balance > TOLERANCE);
  const hasLosers = players.some((p) => p.balance < -TOLERANCE);
  return hasWinners && hasLosers;
}

export function adjustBalances(players: PlayerBalance[]): AdjustmentResult {
  const delta = round2(players.reduce((sum, p) => sum + p.balance, 0));
  const adjustments = new Map<string, number>();

  if (Math.abs(delta) < TOLERANCE) {
    return { adjusted: players, delta, adjustments };
  }

  let adjusted: PlayerBalance[];

  if (delta > 0) {
    // Positive delta (excess): reduce winners' gains proportionally
    const totalGains = players
      .filter((p) => p.balance > TOLERANCE)
      .reduce((s, p) => s + p.balance, 0);

    adjusted = players.map((p) => {
      if (p.balance > TOLERANCE) {
        const adj = -round2((p.balance / totalGains) * delta);
        adjustments.set(p.name, adj);
        return { ...p, balance: round2(p.balance + adj) };
      }
      return p;
    });
  } else {
    // Negative delta (deficit): reduce losers' debts proportionally
    const totalLosses = players
      .filter((p) => p.balance < -TOLERANCE)
      .reduce((s, p) => s + Math.abs(p.balance), 0);
    const absDelta = Math.abs(delta);

    adjusted = players.map((p) => {
      if (p.balance < -TOLERANCE) {
        const adj = round2((Math.abs(p.balance) / totalLosses) * absDelta);
        adjustments.set(p.name, adj);
        return { ...p, balance: round2(p.balance + adj) };
      }
      return p;
    });
  }

  // Fix any remaining rounding residual by adjusting the largest-adjusted player
  const residual = round2(-adjusted.reduce((s, p) => s + p.balance, 0));
  if (Math.abs(residual) >= 0.005) {
    let maxAdjName = "";
    let maxAdjAbs = 0;
    for (const [name, adj] of adjustments) {
      if (Math.abs(adj) > maxAdjAbs) {
        maxAdjAbs = Math.abs(adj);
        maxAdjName = name;
      }
    }
    if (maxAdjName) {
      adjusted = adjusted.map((p) =>
        p.name === maxAdjName
          ? { ...p, balance: round2(p.balance + residual) }
          : p
      );
      adjustments.set(
        maxAdjName,
        round2((adjustments.get(maxAdjName) ?? 0) + residual)
      );
    }
  }

  return { adjusted, delta, adjustments };
}

export function calculatePayouts(players: PlayerBalance[]): Payout[] {
  const debtors: PlayerBalance[] = [];
  const creditors: PlayerBalance[] = [];

  for (const p of players) {
    if (p.balance < -0.01) {
      debtors.push({ name: p.name, balance: Math.abs(p.balance) });
    } else if (p.balance > 0.01) {
      creditors.push({ name: p.name, balance: p.balance });
    }
  }

  debtors.sort((a, b) => b.balance - a.balance);
  creditors.sort((a, b) => b.balance - a.balance);

  const payouts: Payout[] = [];
  let i = 0;
  let j = 0;

  while (i < debtors.length && j < creditors.length) {
    const amount = Math.min(debtors[i].balance, creditors[j].balance);
    payouts.push({
      from: debtors[i].name,
      to: creditors[j].name,
      amount: Math.round(amount * 100) / 100,
    });
    debtors[i].balance -= amount;
    creditors[j].balance -= amount;
    if (debtors[i].balance < 0.01) i++;
    if (creditors[j].balance < 0.01) j++;
  }

  payouts.sort((a, b) => a.to.localeCompare(b.to));

  return payouts;
}
