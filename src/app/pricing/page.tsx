"use client";

import { Check, Sparkles, Zap } from "lucide-react";
import { toast } from "sonner";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useFreeGens } from "@/hooks/use-free-gens";
import { useSession } from "@/hooks/use-session";
import { useWallet } from "@/hooks/use-wallet";
import { PRICING_CONFIG } from "@/lib/catalog";
import { cn } from "@/lib/utils";

/**
 * /pricing — PUBLIC pricing stub (no SessionGate). Plans come from
 * PRICING_CONFIG (planVersion v45.0.0); billing flows ship in Wave 3.
 */
export default function PricingPage() {
  const { data: session } = useSession();
  const user = session?.user;
  const { data: wallet } = useWallet(!!user);
  const { data: freeGens } = useFreeGens(!!user);
  const freeRemaining = freeGens?.rewards?.free_generations?.remaining;

  return (
    <div className="mx-auto w-full max-w-3xl space-y-8 py-2">
      <header className="flex flex-col items-center gap-2 text-center">
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-bold tracking-tight lg:text-3xl">Pricing</h1>
          <Badge variant="secondary" className="font-mono text-[11px]">
            {PRICING_CONFIG.planVersion}
          </Badge>
        </div>
        <p className="max-w-md text-sm text-muted-foreground">
          Simple credit-based pricing for the HF Studio generation workspace.
        </p>
      </header>

      {user && (
        <Card className="py-4" aria-label="Wallet summary">
          <CardContent className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-secondary">
                <Zap className="h-5 w-5 text-[var(--signal)]" aria-hidden />
              </span>
              <div>
                <p className="text-sm font-medium">Your balance</p>
                <p className="text-xl font-bold tabular-nums">
                  {wallet ? `${wallet.credits_balance} credits` : "…"}
                </p>
              </div>
            </div>
            {typeof freeRemaining === "number" && (
              <div className="text-right">
                <p className="text-sm font-medium">Free generations left</p>
                <p className="text-xl font-bold tabular-nums text-[var(--signal)]">
                  {freeRemaining}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <section aria-label="Plans" className="grid gap-4 sm:grid-cols-2 sm:gap-6">
        {PRICING_CONFIG.plans.map((plan) => {
          const isPro = plan.id === "pro";
          return (
            <Card key={plan.id} className="gap-4">
              <CardHeader className="gap-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">{plan.name}</CardTitle>
                  {isPro && (
                    <Sparkles className="h-4 w-4 text-[var(--signal)]" aria-hidden />
                  )}
                </div>
                <p className="flex items-baseline gap-1">
                  <span className="text-3xl font-bold tabular-nums">${plan.price}</span>
                  <span className="text-sm text-muted-foreground">per {plan.period}</span>
                </p>
                <CardDescription>{plan.creditNote}</CardDescription>
              </CardHeader>
              <CardContent className="flex-1">
                <ul className="space-y-2.5">
                  {plan.mainFeatures.map((feature) => (
                    <li key={feature} className="flex items-start gap-2 text-sm">
                      <Check
                        className="mt-0.5 h-4 w-4 shrink-0 text-[var(--signal)]"
                        aria-hidden
                      />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
              <CardFooter>
                <Button
                  variant={isPro ? "default" : "secondary"}
                  disabled={!isPro}
                  aria-disabled={!isPro ? true : undefined}
                  className={cn(
                    "w-full",
                    isPro && "bg-[var(--signal)] text-white hover:bg-[var(--signal)]/90"
                  )}
                  onClick={() =>
                    toast.info(
                      "Billing flows ship in Wave 3 — Pro values are placeholder demo data"
                    )
                  }
                >
                  {isPro ? "Upgrade" : "Current plan"}
                </Button>
              </CardFooter>
            </Card>
          );
        })}
      </section>

      <p className="text-center text-xs text-muted-foreground">
        Free tier anchored to product evidence (10 daily credits). Pro tier values are placeholder
        demo values (not in evidence).
      </p>
    </div>
  );
}
