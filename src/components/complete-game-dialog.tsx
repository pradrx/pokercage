"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toast } from "sonner";
import { CheckCircle } from "lucide-react";
import {
  buildPlayerBalances,
  canAdjustBalances,
  adjustBalances,
} from "@/lib/payout";
import { getDisplayName } from "@/lib/username";
import type { GameWithPlayers } from "@/lib/types";

function formatDelta(n: number): string {
  const rounded = Math.round(n * 100) / 100;
  return `${rounded >= 0 ? "+" : ""}${rounded}`;
}

export function CompleteGameDialog({ game }: { game: GameWithPlayers }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const totalBuyins = game.players.reduce(
    (sum, p) => sum + p.buyins.reduce((s, b) => s + b.amount, 0),
    0
  );
  const totalCashouts = game.players.reduce(
    (sum, p) => sum + (p.cashout ?? 0),
    0
  );
  const allCashedOut = game.players.every((p) => p.cashout !== null);
  const isBalanced = Math.abs(totalBuyins - totalCashouts) < 0.01;

  const displayPlayers = game.players.map((p) => ({
    ...p,
    name: getDisplayName(p),
  }));
  const balances = buildPlayerBalances(displayPlayers);
  const isAdjustable = !isBalanced && canAdjustBalances(balances);
  const adjustmentResult = isAdjustable ? adjustBalances(balances) : null;

  const canComplete =
    game.players.length > 0 && allCashedOut && (isBalanced || isAdjustable);

  async function handleComplete() {
    setLoading(true);
    try {
      const res = await fetch(`/api/games/${game.id}/complete`, {
        method: "POST",
      });

      if (!res.ok) {
        const data = await res.json();
        toast.error(data.error || "Failed to complete game");
        return;
      }

      toast.success("Game completed!");
      setOpen(false);
      router.refresh();
    } catch {
      toast.error("Failed to complete game");
    } finally {
      setLoading(false);
    }
  }

  const delta = Math.round((totalCashouts - totalBuyins) * 100) / 100;

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger
        render={
          <Button
            disabled={!canComplete}
            variant={isAdjustable ? "warning" : "default"}
          >
            <CheckCircle className="mr-2 h-4 w-4" />
            Complete Game
          </Button>
        }
      />
      <AlertDialogContent
        className={isAdjustable ? "sm:max-w-lg" : undefined}
      >
        <AlertDialogHeader>
          <AlertDialogTitle>Complete this game?</AlertDialogTitle>
          <AlertDialogDescription>
            {isAdjustable
              ? "This will lock the ledger, apply proportional adjustments to balance it, and generate payout instructions. You won\u2019t be able to edit the game after this."
              : "This will lock the ledger and generate payout instructions. You won\u2019t be able to edit the game after this."}
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="rounded-lg bg-secondary p-3 text-sm">
          <div className="flex justify-between">
            <span>Total Buyins</span>
            <span className="font-mono">{totalBuyins}</span>
          </div>
          <div className="flex justify-between">
            <span>Total Cashouts</span>
            <span className="font-mono">{totalCashouts}</span>
          </div>
          <div className="mt-1 flex justify-between border-t border-border pt-1 font-medium">
            <span>Net</span>
            <span className="font-mono">{delta}</span>
          </div>
        </div>

        {isAdjustable && adjustmentResult && (
          <div className="space-y-2">
            <p className="text-sm font-medium text-yellow-500">
              Ledger is off by {formatDelta(delta)}.{" "}
              {delta > 0
                ? "Winners\u2019 gains will be reduced proportionally."
                : "Losers\u2019 debts will be reduced proportionally."}
            </p>
            <div className="rounded-lg border border-border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Player</TableHead>
                    <TableHead className="text-right">Raw</TableHead>
                    <TableHead className="text-right">Adj</TableHead>
                    <TableHead className="text-right">Final</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {adjustmentResult.adjusted.map((player) => {
                    const raw =
                      balances.find((b) => b.name === player.name)?.balance ??
                      0;
                    const adj =
                      adjustmentResult.adjustments.get(player.name) ?? 0;
                    return (
                      <TableRow key={player.name}>
                        <TableCell className="font-medium">
                          {player.name}
                        </TableCell>
                        <TableCell className="text-right font-mono text-xs">
                          {formatDelta(raw)}
                        </TableCell>
                        <TableCell className="text-right font-mono text-xs">
                          {Math.abs(adj) < 0.01 ? "\u2014" : formatDelta(adj)}
                        </TableCell>
                        <TableCell className="text-right font-mono text-xs font-medium">
                          {formatDelta(player.balance)}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </div>
        )}

        {!allCashedOut && (
          <p className="text-sm text-destructive">
            Not all players have cashed out yet.
          </p>
        )}
        {allCashedOut && !isBalanced && !isAdjustable && (
          <p className="text-sm text-destructive">
            The ledger is not balanced and all players are on the same side.
            Adjustments cannot be applied.
          </p>
        )}

        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            disabled={!canComplete || loading}
            onClick={handleComplete}
          >
            {loading ? "Completing..." : "Complete Game"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
