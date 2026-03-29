"use client";

import { useRouter } from "next/navigation";
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { BuyinDialog } from "@/components/buyin-dialog";
import { CashoutDialog } from "@/components/cashout-dialog";
import { toast } from "sonner";
import { Trash2, X } from "lucide-react";
import type { GameWithPlayers } from "@/lib/types";
import { cn } from "@/lib/utils";

export function LedgerTable({
  game,
  editable,
}: {
  game: GameWithPlayers;
  editable: boolean;
}) {
  const router = useRouter();

  async function removePlayer(playerId: string) {
    const res = await fetch(
      `/api/games/${game.id}/players/${playerId}`,
      { method: "DELETE" }
    );
    if (!res.ok) {
      const data = await res.json();
      toast.error(data.error || "Failed to remove player");
      return;
    }
    router.refresh();
  }

  async function removeBuyin(playerId: string, buyinId: string) {
    const res = await fetch(
      `/api/games/${game.id}/players/${playerId}/buyins/${buyinId}`,
      { method: "DELETE" }
    );
    if (!res.ok) {
      const data = await res.json();
      toast.error(data.error || "Failed to remove buyin");
      return;
    }
    router.refresh();
  }

  const totals = game.players.reduce(
    (acc, p) => {
      const totalBuyins = p.buyins.reduce((s, b) => s + b.amount, 0);
      const cashout = p.cashout ?? 0;
      const delta = p.cashout !== null ? cashout - totalBuyins : 0;
      return {
        buyins: acc.buyins + totalBuyins,
        cashouts: acc.cashouts + (p.cashout ?? 0),
        delta: acc.delta + delta,
      };
    },
    { buyins: 0, cashouts: 0, delta: 0 }
  );

  if (game.players.length === 0) {
    return (
      <p className="py-8 text-center text-muted-foreground">
        No players yet. Add a player to start the ledger.
      </p>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Player</TableHead>
          <TableHead>Buyins</TableHead>
          <TableHead className="text-right">Total In</TableHead>
          <TableHead className="text-right">Cashout</TableHead>
          <TableHead className="text-right">Delta</TableHead>
          {editable && <TableHead className="w-10" />}
        </TableRow>
      </TableHeader>
      <TableBody>
        {game.players.map((player) => {
          const totalBuyins = player.buyins.reduce(
            (s, b) => s + b.amount,
            0
          );
          const delta =
            player.cashout !== null ? player.cashout - totalBuyins : null;

          return (
            <TableRow key={player.id}>
              <TableCell className="font-medium">{player.name}</TableCell>
              <TableCell>
                <div className="flex flex-wrap items-center gap-1">
                  {player.buyins.map((buyin) => (
                    <span
                      key={buyin.id}
                      className="inline-flex items-center gap-0.5 rounded bg-secondary px-1.5 py-0.5 text-xs font-mono"
                    >
                      {buyin.amount}
                      {editable && (
                        <button
                          onClick={() => removeBuyin(player.id, buyin.id)}
                          className="ml-0.5 text-muted-foreground hover:text-destructive"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      )}
                    </span>
                  ))}
                  {editable && (
                    <BuyinDialog gameId={game.id} playerId={player.id} />
                  )}
                </div>
              </TableCell>
              <TableCell className="text-right font-mono">
                {totalBuyins}
              </TableCell>
              <TableCell className="text-right">
                {editable ? (
                  <CashoutDialog
                    gameId={game.id}
                    playerId={player.id}
                    currentCashout={player.cashout}
                  />
                ) : (
                  <span className="font-mono">
                    {player.cashout !== null ? player.cashout : "—"}
                  </span>
                )}
              </TableCell>
              <TableCell
                className={cn(
                  "text-right font-mono font-medium",
                  delta !== null && delta > 0 && "text-green-500",
                  delta !== null && delta < 0 && "text-red-500"
                )}
              >
                {delta !== null
                  ? `${delta >= 0 ? "+" : ""}${delta}`
                  : "—"}
              </TableCell>
              {editable && (
                <TableCell>
                  <Button
                    variant="ghost"
                    size="icon-xs"
                    onClick={() => removePlayer(player.id)}
                    className="text-muted-foreground hover:text-destructive"
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </TableCell>
              )}
            </TableRow>
          );
        })}
      </TableBody>
      <TableFooter>
        <TableRow>
          <TableCell className="font-medium">Totals</TableCell>
          <TableCell />
          <TableCell className="text-right font-mono">{totals.buyins}</TableCell>
          <TableCell className="text-right font-mono">{totals.cashouts}</TableCell>
          <TableCell
            className={cn(
              "text-right font-mono font-medium",
              Math.abs(totals.delta) < 0.01 && "text-green-500",
              Math.abs(totals.delta) >= 0.01 && "text-yellow-500"
            )}
          >
            {totals.delta >= 0 ? "+" : ""}
            {Math.round(totals.delta * 100) / 100}
          </TableCell>
          {editable && <TableCell />}
        </TableRow>
      </TableFooter>
    </Table>
  );
}
