"use client";

import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { PlanCards, type PlanDef } from "@/components/studio/plan-cards";

export interface UpgradeModalContext {
  requiredCredits?: number;
}

interface UpgradeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Extra context — pass `requiredCredits` when the paywall is triggered by GENERATE. */
  context?: UpgradeModalContext;
}

export function UpgradeModal({ open, onOpenChange, context }: UpgradeModalProps) {
  const requiredCredits = context?.requiredCredits;
  const isCreditWall = typeof requiredCredits === "number";

  const handleUpgrade = (_plan: PlanDef) => {
    toast.info("Checkout is not wired in this wave — plans are stubbed");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto border-zinc-800 bg-zinc-950 p-6 text-zinc-100 sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold tracking-tight text-zinc-50">
            {isCreditWall ? "Upgrade Required" : "Special offer"}
          </DialogTitle>
          {isCreditWall ? (
            <DialogDescription className="text-sm text-zinc-400">
              You need {requiredCredits} more credits for this generation.
            </DialogDescription>
          ) : (
            <DialogDescription className="text-sm text-zinc-400">
              Unlock more credits, higher resolutions and faster renders.
            </DialogDescription>
          )}
        </DialogHeader>

        <PlanCards onUpgrade={handleUpgrade} className="pt-2" />

        <DialogFooter className="mt-2 sm:justify-center">
          <Button
            type="button"
            variant="ghost"
            className="text-sm text-zinc-400 hover:text-zinc-200"
            onClick={() => onOpenChange(false)}
          >
            Skip this offer
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
