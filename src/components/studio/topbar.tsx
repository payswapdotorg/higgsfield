"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { Coins, LogOut, Menu } from "lucide-react";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { AuthModal } from "@/components/studio/auth-modal";
import { UpgradeModal } from "@/components/studio/upgrade-modal";
import { useUser } from "@/hooks/api";

const SURFACE_LABELS: Record<string, string> = {
  "/generate": "Cinema Studio",
  "/generations": "My generations",
  "/elements": "My elements",
  "/favorites": "My favorites",
  "/community": "Community",
};

interface TopBarProps {
  onMenuClick: () => void;
}

export function TopBar({ onMenuClick }: TopBarProps) {
  const pathname = usePathname();
  const { data: user, isLoading } = useUser();
  const [authOpen, setAuthOpen] = React.useState(false);
  const [upgradeOpen, setUpgradeOpen] = React.useState(false);

  const surfaceLabel = SURFACE_LABELS[pathname] ?? null;
  const isGuest = !user || user.is_guest;
  const displayName = user?.username ?? user?.email ?? "";
  const initial = (user?.username ?? user?.email ?? "?")
    .charAt(0)
    .toUpperCase();

  return (
    <TooltipProvider delayDuration={200}>
      <header className="sticky top-0 z-40 flex h-14 shrink-0 items-center justify-between gap-3 border-b border-zinc-800 bg-zinc-950/80 px-4 backdrop-blur sm:px-6">
        {/* Left: mobile menu + surface label */}
        <div className="flex min-w-0 items-center gap-3">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="size-9 text-zinc-300 hover:bg-zinc-800 hover:text-zinc-100 lg:hidden"
            onClick={onMenuClick}
            aria-label="Open navigation menu"
          >
            <Menu className="size-5" aria-hidden="true" />
          </Button>
          {surfaceLabel ? (
            <span className="truncate text-sm text-zinc-400">
              {surfaceLabel}
            </span>
          ) : null}
        </div>

        {/* Right: cluster */}
        <div className="flex items-center gap-2 sm:gap-3">
          <Link
            href="/community"
            className="hidden rounded-md px-3 py-1.5 text-sm text-zinc-400 transition-colors hover:text-zinc-100 sm:block"
          >
            Explore
          </Link>

          <Button
            type="button"
            variant="ghost"
            className="h-9 gap-2 px-3 text-sm text-zinc-300 hover:bg-zinc-800 hover:text-zinc-100"
            onClick={() => setUpgradeOpen(true)}
          >
            Pricing
            <Badge className="border border-amber-500/30 bg-amber-500/15 px-1.5 text-[10px] font-semibold text-amber-400">
              55% OFF
            </Badge>
          </Button>

          {isLoading ? (
            <Skeleton className="h-9 w-24 rounded-full bg-zinc-800/70" />
          ) : (
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex h-9 items-center gap-1.5 rounded-full border border-zinc-800 bg-zinc-900/70 px-3 text-sm text-zinc-200">
                  <Coins className="size-4 text-zinc-400" aria-hidden="true" />
                  <span className="tabular-nums">
                    {user ? user.credits.toLocaleString() : "0"}
                  </span>
                </div>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="border-zinc-800 bg-zinc-900 text-zinc-200">
                Credits
              </TooltipContent>
            </Tooltip>
          )}

          {isLoading ? (
            <Skeleton className="h-9 w-28 rounded-full bg-zinc-800/70" />
          ) : isGuest ? (
            <Button
              type="button"
              variant="outline"
              className="h-9 rounded-full border-zinc-700 bg-zinc-900 px-4 text-sm font-medium text-zinc-100 hover:bg-zinc-800"
              onClick={() => setAuthOpen(true)}
            >
              Log in
            </Button>
          ) : (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  className="flex h-9 items-center gap-2 rounded-full border border-zinc-800 bg-zinc-900/70 px-2 pr-3 text-sm text-zinc-200 transition-colors hover:border-zinc-600 hover:text-zinc-100"
                  aria-label="Account menu"
                >
                  <Avatar className="size-6 border border-zinc-700">
                    <AvatarFallback className="bg-zinc-800 text-xs font-semibold text-zinc-200">
                      {initial}
                    </AvatarFallback>
                  </Avatar>
                  <span className="hidden max-w-32 truncate sm:block">
                    {displayName}
                  </span>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="end"
                sideOffset={8}
                className="w-56 border-zinc-800 bg-zinc-900 text-zinc-100"
              >
                {user?.email ? (
                  <>
                    <DropdownMenuLabel className="truncate text-xs font-normal text-zinc-400">
                      {user.email}
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator className="bg-zinc-800" />
                  </>
                ) : null}
                <DropdownMenuItem
                  className="gap-2 text-sm text-zinc-200 focus:bg-zinc-800 focus:text-zinc-100"
                  onClick={() =>
                    void signOut({ callbackUrl: "/generate" })
                  }
                >
                  <LogOut className="size-4" aria-hidden="true" />
                  Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </header>

      <AuthModal open={authOpen} onOpenChange={setAuthOpen} />
      <UpgradeModal open={upgradeOpen} onOpenChange={setUpgradeOpen} />
    </TooltipProvider>
  );
}
