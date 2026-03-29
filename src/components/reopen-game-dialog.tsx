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
import { RotateCcw } from "lucide-react";

export function ReopenGameDialog({ gameId }: { gameId: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleReopen() {
    setLoading(true);
    try {
      const res = await fetch(`/api/games/${gameId}/reopen`, {
        method: "POST",
      });

      if (!res.ok) {
        const data = await res.json();
        toast.error(data.error || "Failed to reopen game");
        return;
      }

      toast.success("Game reopened");
      setOpen(false);
      router.refresh();
    } catch {
      toast.error("Failed to reopen game");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger
        render={
          <Button variant="outline">
            <RotateCcw className="mr-2 h-4 w-4" />
            Reopen Game
          </Button>
        }
      />
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Reopen this game?</AlertDialogTitle>
          <AlertDialogDescription>
            This will unlock the ledger so it can be edited. If payouts have
            already been settled (via Venmo, Zelle, etc.), you may need to
            coordinate adjustments with players.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <p className="text-sm text-muted-foreground">
          The game will return to active status. You can make changes and
          complete it again.
        </p>

        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction disabled={loading} onClick={handleReopen}>
            {loading ? "Reopening..." : "Reopen Game"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
