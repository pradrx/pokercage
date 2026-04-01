"use client";

import { signOut, useSession } from "next-auth/react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import Link from "next/link";
import { LogOut, Settings, Users, Dices } from "lucide-react";
import { CageIcon } from "@/components/cage-icon";

export function Navbar() {
  const { data: session } = useSession();

  return (
    <header className="border-b border-border">
      <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4">
        <div className="flex items-center gap-6">
          <Link href="/dashboard" className="flex items-center gap-1.5 text-lg font-bold tracking-tight">
            <CageIcon className="h-6 w-6" />
            pokercage
          </Link>
          {session?.user && (
            <>
              <Link
                href="/groups"
                className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                <Users className="h-4 w-4" />
                Groups
              </Link>
              <Link
                href="/dashboard/completed"
                className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                <Dices className="h-4 w-4" />
                Games
              </Link>
            </>
          )}
        </div>
        {session?.user && (
          <DropdownMenu>
            <DropdownMenuTrigger className="outline-none">
              <Avatar className="h-8 w-8">
                <AvatarImage src={session.user.image ?? undefined} />
                <AvatarFallback>
                  {(session.user.username ?? session.user.name)?.charAt(0)?.toUpperCase() ?? "U"}
                </AvatarFallback>
              </Avatar>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                onClick={() => (window.location.href = "/settings")}
              >
                <Settings className="mr-2 h-4 w-4" />
                Settings
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => signOut({ callbackUrl: "/" })}
              >
                <LogOut className="mr-2 h-4 w-4" />
                Sign out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
    </header>
  );
}
