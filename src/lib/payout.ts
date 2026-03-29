export type PlayerBalance = {
  name: string;
  balance: number;
};

export type Payout = {
  from: string;
  to: string;
  amount: number;
};

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

  return payouts;
}
