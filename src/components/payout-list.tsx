import type { Payout } from "@/lib/payout";
import { ArrowRight } from "lucide-react";

export function PayoutList({ payouts }: { payouts: Payout[] }) {
  if (payouts.length === 0) {
    return (
      <p className="text-muted-foreground">No payouts needed — everyone broke even.</p>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {payouts.map((p, i) => (
        <div
          key={i}
          className="flex items-center gap-3 rounded-lg bg-secondary px-4 py-3"
        >
          <span className="font-medium text-green-500">{p.to}</span>
          <ArrowRight className="h-4 w-4 text-muted-foreground" />
          <span className="font-medium text-red-500">{p.from}</span>
          <span className="ml-auto font-mono font-bold">{p.amount}</span>
        </div>
      ))}
    </div>
  );
}
