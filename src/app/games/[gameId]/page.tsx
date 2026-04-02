import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { Navbar } from "@/components/navbar";
import { LedgerTable } from "@/components/ledger-table";
import { GroupGameAddPlayer } from "@/components/group-game-add-player";
import { CompleteGameDialog } from "@/components/complete-game-dialog";
import { ReopenGameDialog } from "@/components/reopen-game-dialog";
import { PayoutList } from "@/components/payout-list";
import { ShareLinkButton } from "@/components/share-link-button";
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
import { canViewGame, canEditGame } from "@/lib/auth-helpers";
import { getDisplayName, buildFullNameMap } from "@/lib/username";
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
    group: true,
  };

  const game = (
    await prisma.game.findUnique({ where: { slug: gameId }, include }) ??
    await prisma.game.findUnique({ where: { id: gameId }, include })
  ) as (GameWithPlayersAndEvents & { group: { id: string; name: string } }) | null;

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

  const REOPEN_WINDOW_MS = 7 * 24 * 60 * 60 * 1000;
  const lastCompletedEvent = game.events.find((e) => e.type === "GAME_COMPLETED");
  const canReopen =
    game.status === "COMPLETED" &&
    hasEditAccess &&
    !!lastCompletedEvent &&
    Date.now() - new Date(lastCompletedEvent.createdAt).getTime() < REOPEN_WINDOW_MS;

  // Load group members for the player selector
  let groupMembers: GroupMemberWithUser[] = [];
  if (canEdit) {
    const members = await prisma.groupMember.findMany({
      where: { groupId: game.groupId },
      include: {
        user: { select: { id: true, name: true, email: true, image: true, username: true } },
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

  const displayPlayers = game.players.map((p) => ({
    ...p,
    name: getDisplayName(p),
  }));
  const rawBalances = buildPlayerBalances(displayPlayers);
  const adjustmentResult = adjustBalances(rawBalances);
  const wasAdjusted = Math.abs(adjustmentResult.delta) >= 0.01;
  const payouts =
    game.status === "COMPLETED"
      ? calculatePayouts(adjustmentResult.adjusted)
      : [];

  const paymentInfoMap = buildPaymentInfoMap(displayPlayers);
  const fullNameMap = buildFullNameMap(game.players);

  return (
    <>
      <Navbar />
      <div className="mx-auto max-w-4xl px-4 py-8">
        <div className="mb-2">
          <Link
            href={`/groups/${game.group.id}`}
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            {game.group.name}
          </Link>
          <span className="text-sm text-muted-foreground mx-1.5">/</span>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold">{game.name}</h1>
            <Badge variant={isActive ? "default" : "secondary"}>
              {isActive ? "Active" : "Completed"}
            </Badge>
          </div>
          <div className="flex items-center gap-2">
            <ShareLinkButton shareToken={game.shareToken} slug={game.slug} />
            {canEdit && <CompleteGameDialog game={game} />}
            {canReopen && <ReopenGameDialog gameId={game.id} />}
          </div>
        </div>

        <p className="mt-1 text-sm text-muted-foreground">
          {new Date(game.date).toLocaleDateString()}
        </p>

        <Separator className="my-6" />

        {canEdit && (
          <div className="mb-4">
            <GroupGameAddPlayer
              gameId={game.id}
              groupId={game.groupId}
              availableMembers={groupMembers}
            />
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
      </div>
    </>
  );
}
