import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { Navbar } from "@/components/navbar";
import { LedgerTable } from "@/components/ledger-table";
import { AddPlayerForm } from "@/components/add-player-form";
import { GroupGameAddPlayer } from "@/components/group-game-add-player";
import { CompleteGameDialog } from "@/components/complete-game-dialog";
import { PayoutList } from "@/components/payout-list";
import { ShareLinkButton } from "@/components/share-link-button";
import { GameHistory } from "@/components/game-history";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { calculatePayouts, type PlayerBalance } from "@/lib/payout";
import { buildPaymentInfoMap } from "@/lib/payment";
import { canViewGame, canEditGame } from "@/lib/auth-helpers";
import type { GameWithPlayersAndEvents, GroupMemberWithUser } from "@/lib/types";

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
        include: {
          buyins: { orderBy: { createdAt: "asc" } },
          groupMember: {
            select: {
              venmo: true, zelle: true, cashapp: true, paypal: true,
              user: { select: { venmo: true, zelle: true, cashapp: true, paypal: true } },
            },
          },
        },
      },
      events: { orderBy: { createdAt: "desc" } },
      group: true,
    },
  })) as (GameWithPlayersAndEvents & { group: { id: string; name: string } | null }) | null;

  if (!game) {
    notFound();
  }

  const hasViewAccess = await canViewGame(game, session.user.id);
  if (!hasViewAccess) {
    notFound();
  }

  const hasEditAccess = await canEditGame(game, session.user.id);
  const isActive = game.status === "ACTIVE";
  const canEdit = isActive && hasEditAccess;

  // Load group members for the player selector if this is a group game
  let groupMembers: GroupMemberWithUser[] = [];
  if (game.groupId && canEdit) {
    const members = await prisma.groupMember.findMany({
      where: { groupId: game.groupId },
      include: {
        user: { select: { id: true, name: true, email: true, image: true } },
      },
      orderBy: { createdAt: "asc" },
    });
    // Filter out members already in this game
    const existingMemberIds = new Set(
      game.players
        .map((p) => p.groupMemberId)
        .filter((id): id is string => id !== null)
    );
    groupMembers = members.filter(
      (m) => !existingMemberIds.has(m.id)
    ) as GroupMemberWithUser[];
  }

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

  const paymentInfoMap = buildPaymentInfoMap(game.players);

  return (
    <>
      <Navbar />
      <div className="mx-auto max-w-4xl px-4 py-8">
        {game.group && (
          <div className="mb-2">
            <Link
              href={`/groups/${game.group.id}`}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              {game.group.name}
            </Link>
            <span className="text-sm text-muted-foreground mx-1.5">/</span>
          </div>
        )}

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold">{game.name}</h1>
            <Badge variant={isActive ? "default" : "secondary"}>
              {isActive ? "Active" : "Completed"}
            </Badge>
          </div>
          <div className="flex items-center gap-2">
            <ShareLinkButton shareToken={game.shareToken} />
            {canEdit && <CompleteGameDialog game={game} />}
          </div>
        </div>

        <p className="mt-1 text-sm text-muted-foreground">
          {new Date(game.date).toLocaleDateString()}
        </p>

        <Separator className="my-6" />

        {canEdit && (
          <div className="mb-4">
            {game.groupId ? (
              <GroupGameAddPlayer
                gameId={game.id}
                groupId={game.groupId}
                availableMembers={groupMembers}
              />
            ) : (
              <AddPlayerForm gameId={game.id} />
            )}
          </div>
        )}

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Ledger</CardTitle>
          </CardHeader>
          <CardContent>
            <LedgerTable game={game} editable={canEdit} />
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
                <PayoutList payouts={payouts} paymentInfoMap={paymentInfoMap} />
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
