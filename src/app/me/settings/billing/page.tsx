import type { Metadata } from "next";
import { CreditCard, Receipt, Wallet } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SignInGate } from "@/components/settings/sign-in-gate";
import { DisclosureCard, DatumRow } from "@/components/settings/settings-shared";
import { pageUser } from "@/lib/page-auth";
import { accountBodiesFor } from "@/lib/account-bodies";

/**
 * /me/settings/billing — HF-W5 (PRIVATE, server-rendered).
 *
 * Route truth: evidence/rea-2026-10-17/route-preload-manifest.json key
 * `/_private/me/settings/_team/billing` (the live page nests under the pathless
 * _team layout; the clone flattens it — disclosed in settings-nav).
 *
 * Data contract: the captured `wallet` body verbatim (api-bodies-digest.json →
 * wallet: workspace_id, credits_balance, total_credits, expire_days, …), computed
 * by the shared src/lib/account-bodies.ts (same source as /api/user/wallet).
 *
 * Disclosure: the captured operator account was free-plan — zero invoices, payment
 * methods or checkout bodies exist in the survey; the clone ships the real wallet
 * summary + an honest empty state for everything else (the payment/provider surface
 * is the deferred billing-checkout group).
 */

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Billing — Settings — HF Studio",
};

export default async function BillingPage() {
  const user = await pageUser();
  if (!user) return <SignInGate />;

  const { walletBody: w, userBody: u } = await accountBodiesFor(user);

  return (
    <section className="space-y-6" aria-label="Billing">
      <header className="space-y-1">
        <h1 className="text-xl font-bold tracking-tight lg:text-2xl">Billing</h1>
        <p className="font-mono text-xs text-muted-foreground">
          live route key: /_private/me/settings/_team/billing
        </p>
      </header>

      {/* ── Wallet (captured wallet body, verbatim keys) ── */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Wallet className="h-5 w-5 text-[var(--signal)]" aria-hidden />
            Wallet
          </CardTitle>
        </CardHeader>
        <CardContent>
          <dl>
            <DatumRow label="credits_balance" value={<span className="tabular-nums">{w.credits_balance.toLocaleString("en-US")}</span>} />
            <DatumRow label="total_credits" value={<span className="tabular-nums">{w.total_credits.toLocaleString("en-US")}</span>} />
            <DatumRow label="subscription_balance" value={<span className="tabular-nums">{w.subscription_balance}</span>} />
            <DatumRow label="on_demand_credits" value={<span className="tabular-nums">{w.on_demand_credits}</span>} />
            <DatumRow label="bonus_credits" value={<span className="tabular-nums">{w.bonus_credits}</span>} />
            <DatumRow label="bonus_credits_expire_at" value={w.bonus_credits_expire_at ?? <span className="text-muted-foreground">null</span>} />
            <DatumRow label="expire_days" value={<span className="tabular-nums">{w.expire_days}</span>} />
            <DatumRow label="credit_limit" value={w.credit_limit ?? <span className="text-muted-foreground">null</span>} />
            <DatumRow label="next_credit_allocation_date" value={w.next_credit_allocation_date ?? <span className="text-muted-foreground">null</span>} />
            <DatumRow label="group_credit_allocation" value={w.group_credit_allocation === null ? <span className="text-muted-foreground">null</span> : String(w.group_credit_allocation)} />
            <DatumRow label="workspace_id" value={<span className="font-mono text-xs">{w.workspace_id}</span>} />
            <DatumRow label="wallet_created_at" value={<span className="font-mono text-xs">{w.wallet_created_at}</span>} />
          </dl>
        </CardContent>
      </Card>

      {/* ── Honest empty state: no invoices / payment methods captured ── */}
      <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-border bg-card/50 px-6 py-16 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-secondary">
          <Receipt className="h-7 w-7 text-muted-foreground" aria-hidden />
        </div>
        <h2 className="text-lg font-semibold">No billing history</h2>
        <p className="max-w-md text-sm text-muted-foreground">
          The captured account is on the free plan (
          <code className="rounded bg-muted px-1 py-0.5 text-xs">plan_type: {u.plan_type}</code>,
          <code className="ml-1 rounded bg-muted px-1 py-0.5 text-xs">billing_period: null</code>)
          — no invoices, payment methods or checkout bodies were captured in the evidence
          survey, so none are rendered here.
        </p>
        <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <CreditCard className="h-3.5 w-3.5" aria-hidden />
          Payment-method and checkout surfaces are the deferred billing-checkout group.
        </p>
      </div>

      <DisclosureCard title="Demo scope — free-plan capture">
        <p>
          The wallet rows above are the real captured wallet body shape
          (api-bodies-digest.json → <code className="rounded bg-muted px-1 py-0.5 text-xs">wallet</code>)
          computed from this clone&apos;s credit pools. Everything beyond it (invoice lists,
          payment methods, auto-top-up settings —{" "}
          <code className="rounded bg-muted px-1 py-0.5 text-xs">/fnf/v2/auto-top-ups/settings</code>{" "}
          appears in the net capture as GET-only) is uncaptured for the free-plan operator and
          ships as the honest empty state above.
        </p>
      </DisclosureCard>
    </section>
  );
}
