"use client";

import type { Payout } from "@/lib/payout";
import type { PaymentInfo } from "@/lib/types";
import { ArrowRight } from "lucide-react";
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from "@/components/ui/tooltip";

function PlayerName({
  name,
  className,
  paymentInfo,
}: {
  name: string;
  className: string;
  paymentInfo?: PaymentInfo;
}) {
  const hasPayment =
    paymentInfo &&
    (paymentInfo.venmo || paymentInfo.zelle || paymentInfo.cashapp || paymentInfo.paypal);

  if (!hasPayment) {
    return <span className={`font-medium ${className}`}>{name}</span>;
  }

  return (
    <Tooltip>
      <TooltipTrigger>
        <span
          className={`font-medium ${className} cursor-help underline decoration-dotted underline-offset-4`}
        >
          {name}
        </span>
      </TooltipTrigger>
      <TooltipContent>
        <div className="flex flex-col gap-1">
          {paymentInfo!.venmo && <span>Venmo: {paymentInfo!.venmo}</span>}
          {paymentInfo!.zelle && <span>Zelle: {paymentInfo!.zelle}</span>}
          {paymentInfo!.cashapp && <span>CashApp: {paymentInfo!.cashapp}</span>}
          {paymentInfo!.paypal && <span>PayPal: {paymentInfo!.paypal}</span>}
        </div>
      </TooltipContent>
    </Tooltip>
  );
}

export function PayoutList({
  payouts,
  paymentInfoMap = {},
}: {
  payouts: Payout[];
  paymentInfoMap?: Record<string, PaymentInfo>;
}) {
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
          <PlayerName
            name={p.to}
            className="text-green-500"
            paymentInfo={paymentInfoMap[p.to]}
          />
          <ArrowRight className="h-4 w-4 text-muted-foreground" />
          <PlayerName
            name={p.from}
            className="text-red-500"
            paymentInfo={paymentInfoMap[p.from]}
          />
          <span className="ml-auto font-mono font-bold">{p.amount}</span>
        </div>
      ))}
    </div>
  );
}
