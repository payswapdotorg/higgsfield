import type { Metadata } from "next";
import Link from "next/link";
import { Check, Minus, Sparkles, TriangleAlert, Zap } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SignInGate } from "@/components/settings/sign-in-gate";
import { DisclosureCard, DatumRow } from "@/components/settings/settings-shared";
import { pageUser } from "@/lib/page-auth";
import { accountBodiesFor } from "@/lib/account-bodies";
import { PRICING_PLANS_TREE, PRICING_PLAN_VERSION } from "@/lib/pricing-plans";
import { cn } from "@/lib/utils";

/**
 * /me/settings/subscription — HF-W5 (PRIVATE, server-rendered).
 *
 * Route truth: evidence/rea-2026-10-17/route-preload-manifest.json key
 * `/_private/me/settings/subscription`.
 *
 * Data contracts (verbatim):
 *   - plan_type + credit pools + subscription state → the captured `user` body
 *     (api-bodies-digest.json → user) computed by src/lib/account-bodies.ts
 *     (billing_period, is_cancel_inited, plan_ends_at, has_unlim,
 *     is_gift_subscription, pause fields — free-plan values as captured)
 *   - plan comparison tree → the captured pricing-config v45.0.0 plans
 *     (api-bodies-digest.json → pricing-config; the digest string truncates at
 *     20,000 chars so exactly the free + pro plan objects are complete — nothing
 *     further is invented; src/lib/pricing-plans.ts).
 *
 * Disclosures: checkout/upgrade flows are NOT cloned (the billing-checkout
 * provider surface is the deferred group in docs/route-parity-report.md) — the
 * Compare plans affordance links to the informational /pricing page instead.
 */

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Subscription — Settings — HF Studio",
};

function StatusIcon({ status }: { status: string }) {
  if (status === "included") return <Check className="h-3.5 w-3.5 text-emerald-500" aria-hidden />;
  if (status === "limited") return <TriangleAlert className="h-3.5 w-3.5 text-amber-500" aria-hidden />;
  return <Minus className="h-3.5 w-3.5 text-muted-foreground" aria-hidden />;
}

export default async function SubscriptionPage() {
  const user = await pageUser();
  if (!user) return <SignInGate />;

  const { userBody: u } = await accountBodiesFor(user);
  const isFree = u.plan_type === "free";
  const currentPlan = isFree ? "free" : "pro";

  return (
    <section className="space-y-6" aria-label="Subscription">
      <header className="space-y-1">
        <h1 className="text-xl font-bold tracking-tight lg:text-2xl">Subscription</h1>
        <p className="font-mono text-xs text-muted-foreground">
          live route key: /_private/me/settings/subscription
        </p>
      </header>

      {/* ── Current plan (captured user-body keys, verbatim) ── */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <CardTitle className="text-lg">Current plan</CardTitle>
          {/* Checkout surface is deferred (billing-checkout group) — the
              informational /pricing page is the clone's plan surface. */}
          <Button asChild variant="secondary" size="sm">
            <Link href="/pricing">
              <Sparkles className="mr-1 h-3.5 w-3.5" aria-hidden />
              Compare plans
            </Link>
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap items-center gap-3">
            <Badge className="gap-1.5 text-sm capitalize">
              <Zap className="h-3.5 w-3.5" aria-hidden />
              {u.plan_type}
            </Badge>
            <span className="text-sm text-muted-foreground">
              {PRICING_PLANS_TREE[currentPlan].tagline}
            </span>
          </div>

          <dl>
            <DatumRow label="plan_type" value={<span className="font-mono">{u.plan_type}</span>} />
            <DatumRow label="billing_period" value={u.billing_period ?? <span className="text-muted-foreground">null (free plan)</span>} />
            <DatumRow label="subscription_credits" value={<span className="tabular-nums">{u.subscription_credits.toFixed(1)}</span>} />
            <DatumRow label="package_credits" value={<span className="tabular-nums">{u.package_credits.toFixed(1)}</span>} />
            <DatumRow label="daily_credits" value={<span className="tabular-nums">{u.daily_credits.toFixed(1)}</span>} />
            <DatumRow label="bonus_credits" value={<span className="tabular-nums">{u.bonus_credits.toFixed(1)}</span>} />
            <DatumRow label="total_plan_credits" value={<span className="tabular-nums">{u.total_plan_credits}</span>} />
            <DatumRow label="has_unlim" value={String(u.has_unlim)} />
            <DatumRow label="is_gift_subscription" value={String(u.is_gift_subscription)} />
            <DatumRow label="is_cancel_inited" value={String(u.is_cancel_inited)} />
            <DatumRow label="plan_ends_at" value={u.plan_ends_at ?? <span className="text-muted-foreground">null</span>} />
            <DatumRow label="next_credit_allocation_at" value={u.next_credit_allocation_at ?? <span className="text-muted-foreground">null</span>} />
            <DatumRow label="pause_starts_at / pause_resumes_at" value={
              u.pause_starts_at || u.pause_resumes_at ? (
                <span className="font-mono text-xs">{u.pause_starts_at} / {u.pause_resumes_at}</span>
              ) : (
                <span className="text-muted-foreground">null / null</span>
              )
            } />
            <DatumRow label="is_pause_scheduled / is_paused" value={`${u.is_pause_scheduled} / ${u.is_paused}`} />
            <DatumRow label="cohort" value={<span className="font-mono">{u.cohort}</span>} />
            <DatumRow label="auto_publish" value={String(u.auto_publish)} />
            <DatumRow label="lang" value={<span className="font-mono">{u.lang}</span>} />
          </dl>
        </CardContent>
      </Card>

      {/* ── Plan comparison (captured pricing-config v45.0.0 tree: free + pro) ── */}
      <section aria-label="Plan comparison" className="space-y-3">
        <div className="flex items-center gap-2">
          <h2 className="text-lg font-semibold">Plans</h2>
          <Badge variant="secondary" className="font-mono text-[11px]">
            pricing-config {PRICING_PLAN_VERSION}
          </Badge>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          {(Object.keys(PRICING_PLANS_TREE) as Array<"free" | "pro">).map((planId) => {
            const plan = PRICING_PLANS_TREE[planId];
            const isCurrent = planId === currentPlan;
            return (
              <Card key={planId} className={cn(isCurrent && "border-primary/50")}>
                <CardHeader className="space-y-1">
                  <div className="flex items-center justify-between gap-2">
                    <CardTitle className="text-lg capitalize">{planId}</CardTitle>
                    {isCurrent && <Badge>Current</Badge>}
                  </div>
                  <p className="text-sm text-muted-foreground">{plan.tagline}</p>
                  <p className="pt-1 text-2xl font-bold tabular-nums">
                    {plan.credits.amount.toLocaleString("en-US")}{" "}
                    <span className="text-sm font-normal text-muted-foreground">
                      {plan.credits.label}
                    </span>
                  </p>
                  {plan.credits.tooltip && (
                    <p className="text-xs text-muted-foreground">{plan.credits.tooltip}</p>
                  )}
                  {plan.credits.promoItems?.map((item) => (
                    <p key={item.text} className="text-xs text-muted-foreground">
                      <span className="font-semibold">{item.prefix}</span> {item.text}
                    </p>
                  ))}
                </CardHeader>
                <CardContent className="space-y-4">
                  <ul className="space-y-2">
                    {plan.mainFeatures.map((f) => (
                      <li key={f.id} className="flex items-start gap-2 text-sm">
                        <span className="mt-0.5 shrink-0">
                          <StatusIcon status={f.status} />
                        </span>
                        <span>
                          {f.text}
                          {f.tooltip && (
                            <span className="block text-xs text-muted-foreground">{f.tooltip}</span>
                          )}
                        </span>
                      </li>
                    ))}
                  </ul>
                  <div className="rounded-lg border border-border/60 bg-muted/30 p-3">
                    <p className="pb-2 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                      {plan.unlimitedAccess.title}
                    </p>
                    <ul className="space-y-1.5">
                      {plan.unlimitedAccess.features.map((f) => (
                        <li key={f.id} className="flex flex-wrap items-center gap-2 text-sm">
                          <StatusIcon status={f.status} />
                          <span>{f.text}</span>
                          {f.badges?.map((b) => (
                            <Badge key={b.label} variant="outline" className="text-[10px]">
                              {b.label}
                            </Badge>
                          ))}
                        </li>
                      ))}
                    </ul>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </section>

      <DisclosureCard title="Demo scope — checkout flows not cloned">
        <p>
          Plan data above is the captured pricing-config v45.0.0 tree verbatim (taglines,
          credit labels, feature texts and statuses). The digest blob truncates at 20,000
          characters mid-JSON: the <code className="rounded bg-muted px-1 py-0.5 text-xs">free</code>{" "}
          and <code className="rounded bg-muted px-1 py-0.5 text-xs">pro</code> plan objects are
          complete (brace-matched at extraction); any further plans in the live tree were never
          captured and are not rendered. Subscription state keys carry the captured free-plan
          values (billing_period null, plan_ends_at null, pause fields off) — the clone has no
          subscription machinery, and the live checkout/provider surface is the deferred
          billing-checkout group (docs/route-parity-report.md).
        </p>
      </DisclosureCard>
    </section>
  );
}
