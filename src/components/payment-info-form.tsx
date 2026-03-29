"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

export function PaymentInfoForm({
  venmo: initialVenmo,
  zelle: initialZelle,
  cashapp: initialCashapp,
  paypal: initialPaypal,
}: {
  venmo: string;
  zelle: string;
  cashapp: string;
  paypal: string;
}) {
  const [venmo, setVenmo] = useState(initialVenmo);
  const [zelle, setZelle] = useState(initialZelle);
  const [cashapp, setCashapp] = useState(initialCashapp);
  const [paypal, setPaypal] = useState(initialPaypal);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/user/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ venmo, zelle, cashapp, paypal }),
      });

      if (!res.ok) {
        const data = await res.json();
        toast.error(data.error || "Failed to save");
        return;
      }

      toast.success("Payment info saved");
    } catch {
      toast.error("Failed to save");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="space-y-1.5">
        <Label htmlFor="venmo">Venmo</Label>
        <Input
          id="venmo"
          placeholder="@username"
          value={venmo}
          onChange={(e) => setVenmo(e.target.value)}
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="zelle">Zelle</Label>
        <Input
          id="zelle"
          placeholder="Email or phone number"
          value={zelle}
          onChange={(e) => setZelle(e.target.value)}
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="cashapp">CashApp</Label>
        <Input
          id="cashapp"
          placeholder="$cashtag"
          value={cashapp}
          onChange={(e) => setCashapp(e.target.value)}
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="paypal">PayPal</Label>
        <Input
          id="paypal"
          placeholder="Email or username"
          value={paypal}
          onChange={(e) => setPaypal(e.target.value)}
        />
      </div>
      <Button type="submit" disabled={loading} className="self-start">
        Save
      </Button>
    </form>
  );
}
