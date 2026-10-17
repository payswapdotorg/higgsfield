"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Sparkles, Users, LayoutGrid, Folder as FolderIcon, Trash2, CreditCard, Menu, Zap, LogOut, Clapperboard, Megaphone, Newspaper, UserRound, Compass } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useSession, useLogout } from "@/hooks/use-session";
import { useWallet } from "@/hooks/use-wallet";
import { useFolders } from "@/hooks/use-folders";
import { useTrashCount } from "@/hooks/use-trash-count";
import { UpgradeModal } from "@/components/upgrade-modal";
import { cn } from "@/lib/utils";

function Wordmark() {
  return (
    <Link href="/" className="flex items-center gap-2 px-2" aria-label="HF Studio home">
      <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
        <Sparkles className="h-4 w-4" aria-hidden />
      </span>
      <span className="text-sm font-semibold tracking-[0.2em]">HF STUDIO</span>
    </Link>
  );
}

function NavLinks({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  const { data: foldersData } = useFolders();
  const { data: trashData } = useTrashCount();
  const folders = foldersData?.folders ?? [];

  const link = (href: string, label: string, icon: React.ReactNode, exact = false) => {
    const active = exact ? pathname === href : pathname === href || pathname.startsWith(href + "/");
    return (
      <Link
        href={href}
        onClick={onNavigate}
        className={cn(
          "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
          active
            ? "bg-sidebar-accent text-sidebar-accent-foreground"
            : "text-sidebar-foreground/80 hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground"
        )}
        aria-current={active ? "page" : undefined}
      >
        {icon}
        {label}
      </Link>
    );
  };

  return (
    <nav aria-label="Main navigation" className="flex flex-1 flex-col gap-1 overflow-y-auto px-2 py-3 scrollbar-slim">
      {link("/", "Create", <Clapperboard className="h-4 w-4" aria-hidden />, true)}
      {link("/community", "Community", <Users className="h-4 w-4" aria-hidden />)}
      {link("/pricing", "Pricing", <CreditCard className="h-4 w-4" aria-hidden />)}

      {/*
       * Studios group (HF-W3A A5). The live product sidebar is a flat list whose
       * entries include 'Ads Studio', 'Marketing Studio', 'AI Influencer'
       * (evidence: inspect-ads-studio.json links 11801/11815/11791 and
       * inspect-ai-influencer-studio.json links 64/78/54 — same nav, same order).
       * Grouping them under a "Studios" heading is the packet-ordered clone-side
       * layout choice (disclosed in docs/wave-3a-worker-worklog.md).
       */}
      <div className="mt-4 px-3 pb-1 text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
        Studios
      </div>
      {link("/ads-studio", "Ads Studio", <Megaphone className="h-4 w-4" aria-hidden />)}
      {link("/marketing-studio", "Marketing Studio", <Newspaper className="h-4 w-4" aria-hidden />)}
      {link("/ai-influencer-studio", "AI Influencer", <UserRound className="h-4 w-4" aria-hidden />)}

      <div className="mt-4 px-3 pb-1 text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
        My generations
      </div>
      {link("/generate/all", "All generations", <LayoutGrid className="h-4 w-4" aria-hidden />)}
      {folders.map((f) =>
        link(
          `/generate/folder/${f.id}`,
          f.name,
          <FolderIcon className="h-4 w-4 shrink-0" aria-hidden />
        )
      )}
      <Link
        href="/generate/trash"
        onClick={onNavigate}
        className="flex items-center justify-between gap-3 rounded-lg px-3 py-2 text-sm font-medium text-sidebar-foreground/80 transition-colors hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground"
      >
        <span className="flex items-center gap-3">
          <Trash2 className="h-4 w-4" aria-hidden />
          Trash
        </span>
        {(trashData?.count ?? 0) > 0 && (
          <Badge variant="secondary" className="px-1.5 tabular-nums">
            {trashData?.count}
          </Badge>
        )}
      </Link>
    </nav>
  );
}

function SidebarFooter() {
  const { data: session } = useSession();
  const user = session?.user;
  if (!user) {
    return (
      <div className="border-t border-sidebar-border p-3 text-xs text-muted-foreground">
        Not signed in
      </div>
    );
  }
  return (
    <div className="border-t border-sidebar-border p-3">
      <div className="flex items-center gap-2">
        <Avatar className="h-8 w-8">
          <AvatarFallback className="bg-secondary text-xs font-semibold uppercase">
            {user.username.slice(0, 2)}
          </AvatarFallback>
        </Avatar>
        <div className="min-w-0">
          <div className="truncate text-sm font-medium">@{user.username}</div>
          <div className="truncate text-xs text-muted-foreground">{user.plan_type} plan</div>
        </div>
      </div>
    </div>
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const { data: session, isLoading: sessionLoading } = useSession();
  const signedIn = !!session?.user;
  const { data: wallet } = useWallet(signedIn);
  const logout = useLogout();
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();
  const exploreActive = pathname === "/explore" || pathname.startsWith("/explore/");

  return (
    <div className="min-h-screen bg-background">
      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-60 flex-col border-r border-sidebar-border bg-sidebar lg:flex">
        <div className="flex h-14 items-center border-b border-sidebar-border">
          <Wordmark />
        </div>
        <NavLinks />
        <SidebarFooter />
      </aside>

      <div className="flex min-h-screen flex-col lg:pl-60">
        {/* Topbar */}
        <header className="sticky top-0 z-20 flex h-14 items-center gap-2 border-b border-border bg-background/80 px-4 backdrop-blur lg:px-8">
          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="lg:hidden" aria-label="Open navigation menu">
                <Menu className="h-5 w-5" aria-hidden />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-64 bg-sidebar p-0">
              <SheetTitle className="sr-only">Navigation</SheetTitle>
              <div className="flex h-14 items-center border-b border-sidebar-border">
                <Wordmark />
              </div>
              <NavLinks onNavigate={() => setMobileOpen(false)} />
              <SidebarFooter />
            </SheetContent>
          </Sheet>

          <div className="ml-auto flex items-center gap-2">
            {/*
             * Explore topbar link (HF-W3A A5) → /explore, the model catalog surface.
             * Evidence: 'Explore' is the first entry of the live product nav
             * (inspect-ads-studio.json link node 11764; inspect-ai-influencer-studio.json
             * link node 27). inspect-cinema-studio.json does not exist in the survey —
             * cinema-studio topbar citation unavailable, disclosed in the worklog.
             */}
            <Link
              href="/explore"
              aria-current={exploreActive ? "page" : undefined}
              className={cn(
                "flex h-9 items-center gap-1.5 rounded-full border px-3 text-sm font-medium transition-colors",
                exploreActive
                  ? "border-primary/60 bg-primary/10 text-foreground"
                  : "border-border bg-card text-foreground/80 hover:bg-accent hover:text-foreground"
              )}
            >
              <Compass className="h-4 w-4" aria-hidden />
              <span className="hidden sm:inline">Explore</span>
              <span className="sr-only sm:hidden">Explore models</span>
            </Link>
            {signedIn && (
              <Link
                href="/pricing"
                className="flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1.5 text-sm font-medium tabular-nums transition-colors hover:bg-accent"
                aria-label={`${wallet?.credits_balance ?? "…"} credits in wallet`}
              >
                <Zap className="h-4 w-4 text-[var(--signal)]" aria-hidden />
                {sessionLoading ? "…" : (wallet?.credits_balance ?? 0)}
              </Link>
            )}
            {signedIn ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" aria-label="Account menu">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="bg-secondary text-xs font-semibold uppercase">
                        {session.user.username.slice(0, 2)}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-52">
                  <DropdownMenuLabel className="flex flex-col">
                    <span className="text-sm font-medium">@{session.user.username}</span>
                    <span className="text-xs font-normal text-muted-foreground">{session.user.email}</span>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => void logout()} className="cursor-pointer">
                    <LogOut className="mr-2 h-4 w-4" aria-hidden /> Sign out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Button asChild size="sm" variant="secondary" disabled={sessionLoading}>
                <Link href="/">Sign in</Link>
              </Button>
            )}
          </div>
        </header>

        <main className="flex-1 px-4 py-6 lg:px-8">{children}</main>
      </div>

      <UpgradeModal />
    </div>
  );
}
