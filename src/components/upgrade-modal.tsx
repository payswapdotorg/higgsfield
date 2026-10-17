"use client";

import Link from "next/link";
import { Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useUiStore } from "@/store/ui";
import { useWallet } from "@/hooks/use-wallet";

/**
 * UPGRADE REQUIRED modal (HF-W2 §3.4) — opens when a generation is rejected with 402
 * (all credit pools empty for the model).
 */
export function UpgradeModal() {
  const { upgradeOpen, setUpgradeOpen } = useUiStore();
  const { data: wallet } = useWallet();

  return (
    <Dialog open={upgradeOpen} onOpenChange={setUpgradeOpen}>
      <DialogContent className="border-border bg-card sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold tracking-wide">UPGRADE REQUIRED</DialogTitle>
          <DialogDescription>
            You are out of credits for this generation. Your wallet balance is{" "}
            <span className="font-semibold text-foreground tabular-nums">
              {wallet?.credits_balance ?? 0}
            </span>{" "}
            and your free generations are used up. Upgrade your plan to keep creating with HF Studio.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="gap-2 sm:flex-row sm:justify-end">
          <Button variant="ghost" onClick={() => setUpgradeOpen(false)}>
            Maybe later
          </Button>
          <Button asChild>
            <Link href="/pricing" onClick={() => setUpgradeOpen(false)}>
              <Zap className="mr-2 h-4 w-4" aria-hidden />
              Upgrade
            </Link>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
