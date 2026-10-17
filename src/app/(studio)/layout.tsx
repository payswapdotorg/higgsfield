"use client";

import * as React from "react";
import { usePathname } from "next/navigation";

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Sidebar, SidebarContent } from "@/components/studio/sidebar";
import { TopBar } from "@/components/studio/topbar";
import { useComposer } from "@/store/composer";

export default function StudioLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [mobileNavOpen, setMobileNavOpen] = React.useState(false);

  // Hydrate the persisted composer state on the client only (the store is
  // created with skipHydration so SSR markup stays deterministic).
  React.useEffect(() => {
    void useComposer.persist.rehydrate();
  }, []);

  // Close the mobile drawer after any navigation.
  React.useEffect(() => {
    const raf = requestAnimationFrame(() => setMobileNavOpen(false));
    return () => cancelAnimationFrame(raf);
  }, [pathname]);

  return (
    <div className="flex min-h-screen bg-zinc-950 text-zinc-100">
      <Sidebar />

      <div className="flex min-w-0 flex-1 flex-col">
        <TopBar onMenuClick={() => setMobileNavOpen(true)} />
        <main className="flex min-w-0 flex-1 flex-col">{children}</main>
      </div>

      <Sheet open={mobileNavOpen} onOpenChange={setMobileNavOpen}>
        <SheetContent
          side="left"
          className="w-72 gap-0 border-zinc-800 bg-zinc-950 p-0"
        >
          <SheetHeader className="sr-only">
            <SheetTitle>Navigation</SheetTitle>
            <SheetDescription>
              Studio navigation and project list
            </SheetDescription>
          </SheetHeader>
          <SidebarContent />
        </SheetContent>
      </Sheet>
    </div>
  );
}
