"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { LogOut } from "lucide-react";
import type { GroupRole } from "@/generated/prisma/client";

export function LeaveGroupButton({
  groupId,
  groupName,
  myRole,
  memberCount,
}: {
  groupId: string;
  groupName: string;
  myRole: GroupRole;
  memberCount: number;
}) {
  const router = useRouter();
  const [showDialog, setShowDialog] = useState(false);
  const [leaving, setLeaving] = useState(false);

  const isOwner = myRole === "OWNER";
  const cannotLeave = isOwner && memberCount > 1;

  async function handleLeave() {
    setLeaving(true);
    try {
      const res = await fetch(`/api/groups/${groupId}/leave`, {
        method: "POST",
      });
      if (!res.ok) {
        const data = await res.json();
        toast.error(data.error || "Failed to leave group");
        return;
      }
      toast.success("You left the group");
      router.push("/groups");
    } catch {
      toast.error("Failed to leave group");
    } finally {
      setLeaving(false);
    }
  }

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        className="text-destructive"
        disabled={cannotLeave}
        title={cannotLeave ? "Transfer ownership before leaving" : undefined}
        onClick={() => setShowDialog(true)}
      >
        <LogOut className="mr-2 h-4 w-4" />
        Leave Group
      </Button>

      <Dialog
        open={showDialog}
        onOpenChange={(open) => {
          if (!open) setShowDialog(false);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Leave Group</DialogTitle>
          </DialogHeader>
          {isOwner && memberCount <= 1 ? (
            <>
              <p className="text-sm text-muted-foreground">
                You are the only member. Leaving will delete{" "}
                <span className="font-medium text-foreground">{groupName}</span>.
                Game history will be preserved.
              </p>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setShowDialog(false)}
                  disabled={leaving}
                >
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  onClick={handleLeave}
                  disabled={leaving}
                >
                  {leaving ? "Leaving..." : "Leave and Delete Group"}
                </Button>
              </DialogFooter>
            </>
          ) : (
            <>
              <p className="text-sm text-muted-foreground">
                Are you sure you want to leave{" "}
                <span className="font-medium text-foreground">{groupName}</span>?
              </p>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setShowDialog(false)}
                  disabled={leaving}
                >
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  onClick={handleLeave}
                  disabled={leaving}
                >
                  {leaving ? "Leaving..." : "Leave Group"}
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
