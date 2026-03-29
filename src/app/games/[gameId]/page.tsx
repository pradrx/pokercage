import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect, notFound } from "next/navigation";
import { Navbar } from "@/components/navbar";
import { LedgerTable } from "@/components/ledger-table";
import { AddPlayerForm } from "@/components/add-player-form";
import { CompleteGameDialog } from "@/components/complete-game-dialog";
import { PayoutList } from "@/components/payout-list";
import { ShareLinkButton } from "@/components/share-link-button";
import { GameHistory } from "@/components/game-history";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { calculatePayouts, type PlayerBalance } from "@/lib/payout";
import type { GameWithPlayersAndEvents } from "@/lib/types";

export default async function GamePage({
  params,
}: {
  params: Promise<{ gameId: string }>;
}) {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/");
  }

  const { gameId } = await params;

  const game = (await prisma.game.findUnique({
    where: { id: gameId },
    include: {
      players: {
        include: { buyins: { orderBy: { createdAt: "asc" } } },
      },
      events: { orderBy: { createdAt: "desc" } },
    },
  })) as GameWithPlayersAndEvents | null;

  if (!game || game.userId !== session.user.id) {
    notFound();
  }

  const isActive = game.status === "ACTIVE";

  const payouts =
    game.status === "COMPLETED"
      ? calculatePayouts(
          game.players.map((p): PlayerBalance => ({
            name: p.name,
            balance:
              (p.cashout ?? 0) - p.buyins.reduce((s, b) => s + b.amount, 0),
          }))
        )
      : [];

  return (
    <>
      <Navbar />
      <div className="mx-auto max-w-4xl px-4 py-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold">{game.name}</h1>
            <Badge variant={isActive ? "default" : "secondary"}>
              {isActive ? "Active" : "Completed"}
            </Badge>
          </div>
          <div className="flex items-center gap-2">
            <ShareLinkButton shareToken={game.shareToken} />
            {isActive && <CompleteGameDialog game={game} />}
          </div>
        </div>

        <p className="mt-1 text-sm text-muted-foreground">
          {new Date(game.date).toLocaleDateString()}
        </p>

        <Separator className="my-6" />

        {isActive && (
          <div className="mb-4">
            <AddPlayerForm gameId={game.id} />
          </div>
        )}

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Ledger</CardTitle>
          </CardHeader>
          <CardContent>
            <LedgerTable game={game} editable={isActive} />
          </CardContent>
        </Card>

        {game.status === "COMPLETED" && payouts.length > 0 && (
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
      </div>
    </>
  );
}
