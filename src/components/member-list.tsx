"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { CreditCard, Crown, MoreVertical, Trash2 } from "lucide-react";
import type { GroupMemberWithUser } from "@/lib/types";
import type { GroupRole } from "@/generated/prisma/client";

const roleBadgeVariant: Record<GroupRole, "default" | "secondary" | "outline"> = {
  OWNER: "default",
  ADMIN: "secondary",
  MEMBER: "outline",
};

export function MemberList({
  members,
  groupId,
  myRole,
  myMemberId,
}: {
  members: GroupMemberWithUser[];
  groupId: string;
  myRole: GroupRole;
  myMemberId: string;
}) {
  const router = useRouter();
  const isAdmin = myRole === "OWNER" || myRole === "ADMIN";
  const isOwner = myRole === "OWNER";

  // Payment info editing state
  const [editingMember, setEditingMember] = useState<GroupMemberWithUser | null>(null);
  const [editVenmo, setEditVenmo] = useState("");
  const [editZelle, setEditZelle] = useState("");
  const [editCashapp, setEditCashapp] = useState("");
  const [editPaypal, setEditPaypal] = useState("");
  const [saving, setSaving] = useState(false);

  // Transfer ownership state
  const [transferTarget, setTransferTarget] = useState<GroupMemberWithUser | null>(null);
  const [transferring, setTransferring] = useState(false);

  function openEditPayment(member: GroupMemberWithUser) {
    setEditVenmo(member.venmo ?? "");
    setEditZelle(member.zelle ?? "");
    setEditCashapp(member.cashapp ?? "");
    setEditPaypal(member.paypal ?? "");
    setEditingMember(member);
  }

  async function savePaymentInfo() {
    if (!editingMember) return;
    setSaving(true);
    try {
      const res = await fetch(
        `/api/groups/${groupId}/members/${editingMember.id}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            venmo: editVenmo,
            zelle: editZelle,
            cashapp: editCashapp,
            paypal: editPaypal,
          }),
        }
      );
      if (!res.ok) {
        const data = await res.json();
        toast.error(data.error || "Failed to save payment info");
        return;
      }
      toast.success("Payment info saved");
      setEditingMember(null);
      router.refresh();
    } catch {
      toast.error("Failed to save payment info");
    } finally {
      setSaving(false);
    }
  }

  async function removeMember(memberId: string) {
    try {
      const res = await fetch(`/api/groups/${groupId}/members/${memberId}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const data = await res.json();
        toast.error(data.error || "Failed to remove member");
        return;
      }
      router.refresh();
    } catch {
      toast.error("Failed to remove member");
    }
  }

  async function handleTransferOwnership() {
    if (!transferTarget) return;
    setTransferring(true);
    try {
      const res = await fetch(`/api/groups/${groupId}/transfer-ownership`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ memberId: transferTarget.id }),
      });
      if (!res.ok) {
        const data = await res.json();
        toast.error(data.error || "Failed to transfer ownership");
        return;
      }
      toast.success("Ownership transferred");
      setTransferTarget(null);
      router.refresh();
    } catch {
      toast.error("Failed to transfer ownership");
    } finally {
      setTransferring(false);
    }
  }

  return (
    <>
      <div className="divide-y divide-border rounded-lg border">
        {members.map((member) => {
          const isGuest = !member.userId;
          const displayName = member.user?.name ?? member.name;
          const canRemove = isAdmin && member.role !== "OWNER";
          const canEditPayment = isAdmin && isGuest;
          const canTransfer =
            isOwner && !isGuest && member.id !== myMemberId;

          return (
            <div
              key={member.id}
              className="flex items-center justify-between px-4 py-3"
            >
              <div className="flex items-center gap-3">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={member.user?.image ?? undefined} />
                  <AvatarFallback>
                    {displayName.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">{displayName}</span>
                  {!isGuest && (
                    <Badge variant={roleBadgeVariant[member.role]}>
                      {member.role.charAt(0) + member.role.slice(1).toLowerCase()}
                    </Badge>
                  )}
                  {isGuest && (
                    <Badge variant="outline" className="text-muted-foreground">
                      Guest
                    </Badge>
                  )}
                </div>
              </div>

              {(canEditPayment || canRemove || canTransfer) && (
                <DropdownMenu>
                  <DropdownMenuTrigger
                    render={
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    }
                  />
                  <DropdownMenuContent align="end">
                    {canEditPayment && (
                      <DropdownMenuItem
                        onClick={() => openEditPayment(member)}
                      >
                        <CreditCard className="mr-2 h-4 w-4" />
                        Edit Payment Info
                      </DropdownMenuItem>
                    )}
                    {canRemove && (
                      <DropdownMenuItem
                        onClick={() => removeMember(member.id)}
                        className="text-destructive"
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Remove
                      </DropdownMenuItem>
                    )}
                    {(canEditPayment || canRemove) && canTransfer && <DropdownMenuSeparator />}
                    {canTransfer && (
                      <DropdownMenuItem
                        onClick={() => setTransferTarget(member)}
                      >
                        <Crown className="mr-2 h-4 w-4" />
                        Transfer Ownership
                      </DropdownMenuItem>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
          );
        })}
      </div>

      {/* Payment Info Dialog */}
      <Dialog
        open={editingMember !== null}
        onOpenChange={(open) => {
          if (!open) setEditingMember(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              Edit Payment Info — {editingMember?.user?.name ?? editingMember?.name}
            </DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="edit-venmo">Venmo</Label>
              <Input
                id="edit-venmo"
                placeholder="@username"
                value={editVenmo}
                onChange={(e) => setEditVenmo(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="edit-zelle">Zelle</Label>
              <Input
                id="edit-zelle"
                placeholder="Email or phone number"
                value={editZelle}
                onChange={(e) => setEditZelle(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="edit-cashapp">CashApp</Label>
              <Input
                id="edit-cashapp"
                placeholder="$cashtag"
                value={editCashapp}
                onChange={(e) => setEditCashapp(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="edit-paypal">PayPal</Label>
              <Input
                id="edit-paypal"
                placeholder="Email or username"
                value={editPaypal}
                onChange={(e) => setEditPaypal(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button onClick={savePaymentInfo} disabled={saving}>
              {saving ? "Saving..." : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Transfer Ownership Dialog */}
      <Dialog
        open={transferTarget !== null}
        onOpenChange={(open) => {
          if (!open) setTransferTarget(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Transfer Ownership</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Are you sure you want to transfer group ownership to{" "}
            <span className="font-medium text-foreground">
              {transferTarget?.user?.name ?? transferTarget?.name}
            </span>
            ? You will become an Admin.
          </p>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setTransferTarget(null)}
              disabled={transferring}
            >
              Cancel
            </Button>
            <Button onClick={handleTransferOwnership} disabled={transferring}>
              {transferring ? "Transferring..." : "Transfer"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
