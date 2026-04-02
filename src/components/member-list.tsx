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
import { CreditCard, Crown, MoreVertical, ShieldCheck, ShieldMinus, Trash2 } from "lucide-react";
import type { GroupMemberWithUser } from "@/lib/types";
import type { GroupRole } from "@/generated/prisma/client";
import { getMemberDisplayName, getMemberFullName } from "@/lib/username";
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from "@/components/ui/tooltip";

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

  // Remove member confirmation state
  const [removeTarget, setRemoveTarget] = useState<GroupMemberWithUser | null>(null);
  const [removing, setRemoving] = useState(false);

  // Transfer ownership state
  const [transferTarget, setTransferTarget] = useState<GroupMemberWithUser | null>(null);
  const [transferring, setTransferring] = useState(false);

  // Role change state
  const [roleChangeTarget, setRoleChangeTarget] = useState<GroupMemberWithUser | null>(null);
  const [changingRole, setChangingRole] = useState(false);

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

  async function confirmRemoveMember() {
    if (!removeTarget) return;
    setRemoving(true);
    try {
      const res = await fetch(`/api/groups/${groupId}/members/${removeTarget.id}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const data = await res.json();
        toast.error(data.error || "Failed to remove member");
        return;
      }
      setRemoveTarget(null);
      router.refresh();
    } catch {
      toast.error("Failed to remove member");
    } finally {
      setRemoving(false);
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

  async function handleChangeRole() {
    if (!roleChangeTarget) return;
    const newRole = roleChangeTarget.role === "ADMIN" ? "MEMBER" : "ADMIN";
    setChangingRole(true);
    try {
      const res = await fetch(
        `/api/groups/${groupId}/members/${roleChangeTarget.id}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ role: newRole }),
        }
      );
      if (!res.ok) {
        const data = await res.json();
        toast.error(data.error || "Failed to change role");
        return;
      }
      toast.success(
        newRole === "ADMIN" ? "Promoted to Admin" : "Demoted to Member"
      );
      setRoleChangeTarget(null);
      router.refresh();
    } catch {
      toast.error("Failed to change role");
    } finally {
      setChangingRole(false);
    }
  }

  return (
    <>
      <div className="divide-y divide-border rounded-lg border">
        {members.map((member) => {
          const isGuest = !member.userId;
          const displayName = getMemberDisplayName(member);
          const fullName = getMemberFullName(member);
          const canRemove = isAdmin && member.role !== "OWNER" && member.id !== myMemberId;
          const canEditPayment = isAdmin && isGuest;
          const canChangeRole =
            isOwner && !isGuest && member.role !== "OWNER" && member.id !== myMemberId;
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
                  {fullName ? (
                    <Tooltip>
                      <TooltipTrigger>
                        <span className="text-sm font-medium cursor-help underline decoration-dotted underline-offset-4">
                          {displayName}
                        </span>
                      </TooltipTrigger>
                      <TooltipContent>{fullName}</TooltipContent>
                    </Tooltip>
                  ) : (
                    <span className="text-sm font-medium">{displayName}</span>
                  )}
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

              {(canEditPayment || canRemove || canChangeRole || canTransfer) && (
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
                    {canChangeRole && (
                      <DropdownMenuItem
                        onClick={() => setRoleChangeTarget(member)}
                      >
                        {member.role === "ADMIN" ? (
                          <>
                            <ShieldMinus className="mr-2 h-4 w-4" />
                            Demote to Member
                          </>
                        ) : (
                          <>
                            <ShieldCheck className="mr-2 h-4 w-4" />
                            Make Admin
                          </>
                        )}
                      </DropdownMenuItem>
                    )}
                    {canRemove && (
                      <DropdownMenuItem
                        onClick={() => setRemoveTarget(member)}
                        className="text-destructive"
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Remove
                      </DropdownMenuItem>
                    )}
                    {(canEditPayment || canRemove || canChangeRole) && canTransfer && <DropdownMenuSeparator />}
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
              Edit Payment Info — {editingMember ? getMemberDisplayName(editingMember) : ""}
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

      {/* Remove Member Dialog */}
      <Dialog
        open={removeTarget !== null}
        onOpenChange={(open) => {
          if (!open) setRemoveTarget(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Remove Member</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Are you sure you want to remove{" "}
            <span className="font-medium text-foreground">
              {removeTarget ? getMemberDisplayName(removeTarget) : ""}
            </span>{" "}
            from this group?
          </p>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setRemoveTarget(null)}
              disabled={removing}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={confirmRemoveMember}
              disabled={removing}
            >
              {removing ? "Removing..." : "Remove"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Role Change Dialog */}
      <Dialog
        open={roleChangeTarget !== null}
        onOpenChange={(open) => {
          if (!open) setRoleChangeTarget(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {roleChangeTarget?.role === "ADMIN"
                ? "Demote to Member"
                : "Make Admin"}
            </DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            {roleChangeTarget?.role === "ADMIN" ? (
              <>
                Are you sure you want to demote{" "}
                <span className="font-medium text-foreground">
                  {roleChangeTarget ? getMemberDisplayName(roleChangeTarget) : ""}
                </span>{" "}
                to Member?
              </>
            ) : (
              <>
                Are you sure you want to make{" "}
                <span className="font-medium text-foreground">
                  {roleChangeTarget ? getMemberDisplayName(roleChangeTarget) : ""}
                </span>{" "}
                an Admin? Admins can manage games and members.
              </>
            )}
          </p>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setRoleChangeTarget(null)}
              disabled={changingRole}
            >
              Cancel
            </Button>
            <Button onClick={handleChangeRole} disabled={changingRole}>
              {changingRole
                ? "Saving..."
                : roleChangeTarget?.role === "ADMIN"
                  ? "Demote"
                  : "Make Admin"}
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
              {transferTarget ? getMemberDisplayName(transferTarget) : ""}
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
