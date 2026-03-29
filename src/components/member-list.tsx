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
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { CreditCard, MoreVertical, Trash2 } from "lucide-react";
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
}: {
  members: GroupMemberWithUser[];
  groupId: string;
  myRole: GroupRole;
}) {
  const router = useRouter();
  const isAdmin = myRole === "OWNER" || myRole === "ADMIN";
  const [editingMember, setEditingMember] = useState<GroupMemberWithUser | null>(null);
  const [editVenmo, setEditVenmo] = useState("");
  const [editZelle, setEditZelle] = useState("");
  const [editCashapp, setEditCashapp] = useState("");
  const [editPaypal, setEditPaypal] = useState("");
  const [saving, setSaving] = useState(false);

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

  return (
    <div className="divide-y divide-border rounded-lg border">
      {members.map((member) => {
        const isGuest = !member.userId;
        const displayName = member.user?.name ?? member.name;
        const canManage = isAdmin && member.role !== "OWNER";

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
                <Badge variant={roleBadgeVariant[member.role]}>
                  {member.role.charAt(0) + member.role.slice(1).toLowerCase()}
                </Badge>
                {isGuest && (
                  <Badge variant="outline" className="text-muted-foreground">
                    Guest
                  </Badge>
                )}
              </div>
            </div>

            {canManage && (
              <DropdownMenu>
                <DropdownMenuTrigger
                  render={
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  }
                />
                <DropdownMenuContent align="end">
                  <DropdownMenuItem
                    onClick={() => openEditPayment(member)}
                  >
                    <CreditCard className="mr-2 h-4 w-4" />
                    Edit Payment Info
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => removeMember(member.id)}
                    className="text-destructive"
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Remove
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        );
      })}

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
    </div>
  );
}
