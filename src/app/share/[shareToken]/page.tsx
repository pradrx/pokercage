import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { LedgerTable } from "@/components/ledger-table";
import { PayoutList } from "@/components/payout-list";
import { GameHistory } from "@/components/game-history";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { calculatePayouts, type PlayerBalance } from "@/lib/payout";
import type { GameWithPlayersAndEvents } from "@/lib/types";

export default async function SharePage({
  params,
}: {
  params: Promise<{ shareToken: string }>;
}) {
  const { shareToken } = await params;

  const game = (await prisma.game.findUnique({
    where: { shareToken },
    include: {
      players: {
        include: { buyins: { orderBy: { createdAt: "asc" } } },
      },
      events: { orderBy: { createdAt: "desc" } },
      user: { select: { name: true } },
    },
  })) as (GameWithPlayersAndEvents & { user: { name: string | null } }) | null;

  if (!game) {
    notFound();
  }

  const isCompleted = game.status === "COMPLETED";

  const payouts = isCompleted
    ? calculatePayouts(
        game.players.map((p): PlayerBalance => ({
          name: p.name,
          balance:
            (p.cashout ?? 0) - p.buyins.reduce((s, b) => s + b.amount, 0),
        }))
      )
    : [];

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
        {game.user.name && ` \u00b7 Hosted by ${game.user.name}`}
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
              <PayoutList payouts={payouts} />
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
