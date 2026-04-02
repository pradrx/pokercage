import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { LedgerTable } from "@/components/ledger-table";
import { PayoutList } from "@/components/payout-list";
import { GameHistory } from "@/components/game-history";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  calculatePayouts,
  adjustBalances,
  buildPlayerBalances,
} from "@/lib/payout";
import { buildPaymentInfoMap } from "@/lib/payment";
import { getDisplayName, formatUsername, buildFullNameMap } from "@/lib/username";
import type { GameWithPlayersAndEvents } from "@/lib/types";

export default async function SharePage({
  params,
}: {
  params: Promise<{ shareToken: string }>;
}) {
  const { shareToken } = await params;

  const include = {
    players: {
      include: {
        buyins: { orderBy: { createdAt: "asc" as const } },
        groupMember: {
          select: {
            userId: true,
            venmo: true, zelle: true, cashapp: true, paypal: true,
            user: { select: { username: true, name: true, venmo: true, zelle: true, cashapp: true, paypal: true } },
          },
        },
      },
    },
    events: { orderBy: { createdAt: "desc" as const } },
    user: { select: { name: true, username: true } },
  };

  const game = (
    await prisma.game.findUnique({ where: { slug: shareToken }, include }) ??
    await prisma.game.findUnique({ where: { shareToken }, include })
  ) as (GameWithPlayersAndEvents & { user: { name: string | null; username: string | null } }) | null;

  if (!game) {
    notFound();
  }

  const isCompleted = game.status === "COMPLETED";

  const displayPlayers = game.players.map((p) => ({
    ...p,
    name: getDisplayName(p),
  }));
  const rawBalances = buildPlayerBalances(displayPlayers);
  const adjustmentResult = adjustBalances(rawBalances);
  const wasAdjusted = Math.abs(adjustmentResult.delta) >= 0.01;
  const payouts = isCompleted
    ? calculatePayouts(adjustmentResult.adjusted)
    : [];

  const paymentInfoMap = buildPaymentInfoMap(displayPlayers);
  const fullNameMap = buildFullNameMap(game.players);

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <div className="flex items-center gap-3">
        <h1 className="text-2xl font-bold">{game.name}</h1>
        <Badge variant={isCompleted ? "secondary" : "default"}>
          {isCompleted ? "Completed" : "In Progress"}
        </Badge>
      </div>
      <p className="mt-1 text-sm text-muted-foreground">
        {new Date(game.date).toLocaleDateString()}
        {(game.user.username || game.user.name) &&
          ` \u00b7 Hosted by ${game.user.username ? formatUsername(game.user.username) : game.user.name}`}
      </p>

      <Separator className="my-6" />

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Ledger</CardTitle>
        </CardHeader>
        <CardContent>
          <LedgerTable game={game} editable={false} />
        </CardContent>
      </Card>

      {isCompleted && payouts.length > 0 && (
        <>
          <Separator className="my-6" />
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Payouts</CardTitle>
            </CardHeader>
            <CardContent>
              {wasAdjusted && (
                <p className="mb-3 text-sm text-muted-foreground">
                  Balances were proportionally adjusted to account for a
                  ledger imbalance of{" "}
                  {adjustmentResult.delta > 0 ? "+" : ""}
                  {adjustmentResult.delta}.
                </p>
              )}
              <PayoutList payouts={payouts} paymentInfoMap={paymentInfoMap} fullNameMap={fullNameMap} />
            </CardContent>
          </Card>
        </>
      )}

      <Separator className="my-6" />
      <GameHistory events={game.events} />

      <p className="mt-8 text-center text-xs text-muted-foreground">
        Poker Cage
      </p>
    </div>
  );
}
