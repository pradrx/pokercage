"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

export function CashoutDialog({
  gameId,
  playerId,
  currentCashout,
}: {
  gameId: string;
  playerId: string;
  currentCashout: number | null;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [amount, setAmount] = useState(
    currentCashout !== null ? String(currentCashout) : ""
  );
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const num = parseFloat(amount);
    if (isNaN(num) || num < 0) return;

    setLoading(true);
    try {
      const res = await fetch(
        `/api/games/${gameId}/players/${playerId}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ cashout: num }),
        }
      );

      if (!res.ok) {
        const data = await res.json();
        toast.error(data.error || "Failed to set cashout");
        return;
      }

      setOpen(false);
      router.refresh();
    } catch {
      toast.error("Failed to set cashout");
    } finally {
      setLoading(false);
    }
  }

  async function handleClear() {
    setLoading(true);
    try {
      const res = await fetch(
        `/api/games/${gameId}/players/${playerId}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ cashout: null }),
        }
      );

      if (!res.ok) {
        const data = await res.json();
        toast.error(data.error || "Failed to clear cashout");
        return;
      }

      setOpen(false);
      setAmount("");
      router.refresh();
    } catch {
      toast.error("Failed to clear cashout");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        setOpen(o);
        if (o) setAmount(currentCashout !== null ? String(currentCashout) : "");
      }}
    >
      <DialogTrigger
        render={
          <Button variant="ghost" size="sm" className="h-auto px-2 py-1 font-mono">
            {currentCashout !== null ? String(currentCashout) : "—"}
          </Button>
        }
      />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Set Cashout</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="cashout-amount">Amount</Label>
            <Input
              id="cashout-amount"
              type="number"
              step="0.01"
              min="0"
              placeholder="150"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              autoFocus
            />
          </div>
          <div className="flex gap-2">
            <Button type="submit" disabled={loading || amount === ""} className="flex-1">
              {loading ? "Saving..." : "Save"}
            </Button>
            {currentCashout !== null && (
              <Button
                type="button"
                variant="outline"
                disabled={loading}
                onClick={handleClear}
              >
                Clear
              </Button>
            )}
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
