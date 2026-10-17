"use client";

import * as React from "react";
import { Check, Copy } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ToggleGroup,
  ToggleGroupItem,
} from "@/components/ui/toggle-group";
import { usePersonalPromo } from "@/hooks/api";
import { cn } from "@/lib/utils";

/* ------------------------------------------------------------------ */
/* Plan data (typed constants)                                         */
/* ------------------------------------------------------------------ */

export type PlanId = "starter" | "plus";
export type BillingCycle = "monthly" | "annual";

export interface PlanDef {
  id: PlanId;
  name: string;
  monthlyPrice: number;
  annualPrice: number;
  monthlyNote: string;
  annualNote: string;
  features: string[];
  recommended: boolean;
}

export const PLANS: PlanDef[] = [
  {
    id: "starter",
    name: "STARTER",
    monthlyPrice: 10,
    annualPrice: 60,
    monthlyNote: "$10/mo",
    annualNote: "$5/mo",
    features: [
      "1,500 credits / month",
      "1080p exports",
      "Commercial license",
      "Standard queue",
    ],
    recommended: false,
  },
  {
    id: "plus",
    name: "PLUS",
    monthlyPrice: 30,
    annualPrice: 180,
    monthlyNote: "$30/mo",
    annualNote: "$15/mo",
    features: [
      "5,000 credits / month",
      "4K exports",
      "Priority queue",
      "Early access to new models",
      "Team folders",
    ],
    recommended: true,
  },
];

const defaultOnUpgrade = (plan: PlanDef) => {
  toast.info("Checkout is not wired in this wave — plans are stubbed");
  void plan;
};

interface PlanCardsProps {
  onUpgrade?: (plan: PlanDef) => void;
  className?: string;
}

/**
 * Shared pricing surface: promo code row, Monthly/Annual billing toggle and
 * the STARTER / PLUS plan cards. Used by the UpgradeModal paywall and the
 * onboarding "Special offer" screen.
 */
export function PlanCards({ onUpgrade = defaultOnUpgrade, className }: PlanCardsProps) {
  const [billing, setBilling] = React.useState<BillingCycle>("monthly");
  const [copied, setCopied] = React.useState(false);
  const promo = usePersonalPromo();

  const promoCode = promo.data?.promo_code ?? null;

  const copyPromo = async () => {
    if (!promoCode) return;
    try {
      await navigator.clipboard.writeText(promoCode);
      setCopied(true);
      toast.success("Copied");
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Clipboard is not available in this browser");
    }
  };

  return (
    <div className={cn("space-y-6", className)}>
      {/* Promo row */}
      <div className="flex flex-wrap items-center gap-3">
        <Badge className="border border-amber-500/30 bg-amber-500/15 text-amber-400">
          55% OFF
        </Badge>
        {promo.isLoading ? (
          <Skeleton className="h-9 w-40 rounded-md" />
        ) : promoCode ? (
          <div className="flex items-center gap-2">
            <code className="rounded-md border border-zinc-800 bg-zinc-900 px-3 py-1.5 font-mono text-sm tracking-widest text-zinc-200">
              {promoCode}
            </code>
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="size-9 border-zinc-800 bg-zinc-900 text-zinc-400 hover:text-zinc-100"
              onClick={copyPromo}
              aria-label="Copy promo code"
            >
              {copied ? (
                <Check className="size-4 text-emerald-400" />
              ) : (
                <Copy className="size-4" />
              )}
            </Button>
          </div>
        ) : null}
      </div>

      {/* Billing toggle */}
      <ToggleGroup
        type="single"
        value={billing}
        onValueChange={(value) => {
          if (value) setBilling(value as BillingCycle);
        }}
        variant="outline"
        className="mx-auto w-full max-w-xs border-zinc-800 bg-zinc-900"
        aria-label="Billing cycle"
      >
        <ToggleGroupItem
          value="monthly"
          className="flex-1 data-[state=on]:bg-zinc-100 data-[state=on]:text-zinc-900"
        >
          Monthly
        </ToggleGroupItem>
        <ToggleGroupItem
          value="annual"
          className="flex-1 data-[state=on]:bg-zinc-100 data-[state=on]:text-zinc-900"
        >
          Annual
        </ToggleGroupItem>
      </ToggleGroup>

      {/* Plan cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {PLANS.map((plan) => (
          <div
            key={plan.id}
            className={cn(
              "flex flex-col gap-4 rounded-xl border p-5",
              plan.recommended
                ? "border-zinc-500 bg-zinc-900/70"
                : "border-zinc-800 bg-zinc-900/40",
            )}
          >
            <div className="flex items-center justify-between gap-2">
              <span className="text-sm font-semibold tracking-wide text-zinc-100">
                {plan.name}
              </span>
              {plan.recommended ? (
                <Badge className="border border-emerald-500/30 bg-emerald-500/15 text-emerald-400">
                  Recommended
                </Badge>
              ) : null}
            </div>

            <div>
              <div className="text-2xl font-bold tracking-tight text-zinc-50">
                {billing === "monthly"
                  ? `$${plan.monthlyPrice}`
                  : `$${plan.annualPrice}`}
                <span className="ml-1 text-sm font-medium text-zinc-400">
                  /{billing === "monthly" ? "mo" : "yr"}
                </span>
              </div>
              {billing === "annual" ? (
                <p className="mt-1 text-xs text-zinc-400">
                  Billed annually — {plan.annualNote}
                </p>
              ) : (
                <p className="mt-1 text-xs text-zinc-400">
                  Billed monthly — {plan.monthlyNote}
                </p>
              )}
            </div>

            <ul className="flex flex-col gap-2 text-sm text-zinc-300">
              {plan.features.map((feature) => (
                <li key={feature} className="flex items-start gap-2">
                  <Check
                    className="mt-0.5 size-4 shrink-0 text-emerald-400"
                    aria-hidden="true"
                  />
                  <span>{feature}</span>
                </li>
              ))}
            </ul>

            <Button
              type="button"
              className={cn(
                "mt-auto w-full",
                plan.recommended
                  ? "bg-white text-black hover:bg-zinc-200"
                  : "border-zinc-700 bg-zinc-900 text-zinc-100 hover:bg-zinc-800",
              )}
              variant={plan.recommended ? "default" : "outline"}
              onClick={() => onUpgrade(plan)}
            >
              Upgrade to{" "}
              {plan.name.charAt(0) + plan.name.slice(1).toLowerCase()}
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}
