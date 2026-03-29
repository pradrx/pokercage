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
import { toast } from "sonner";
import { CheckCircle } from "lucide-react";
import type { GameWithPlayers } from "@/lib/types";

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
  const canComplete =
    game.players.length > 0 && allCashedOut && isBalanced;

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

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger
        render={
          <Button disabled={!canComplete}>
            <CheckCircle className="mr-2 h-4 w-4" />
            Complete Game
          </Button>
        }
      />
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Complete this game?</AlertDialogTitle>
          <AlertDialogDescription>
            This will lock the ledger and generate payout instructions. You
            won&apos;t be able to edit the game after this.
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
            <span className="font-mono">
              {Math.round((totalCashouts - totalBuyins) * 100) / 100}
            </span>
          </div>
        </div>

        {!allCashedOut && (
          <p className="text-sm text-destructive">
            Not all players have cashed out yet.
          </p>
        )}
        {allCashedOut && !isBalanced && (
          <p className="text-sm text-destructive">
            The ledger is not balanced. Total buyins must equal total cashouts.
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
